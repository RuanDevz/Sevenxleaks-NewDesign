// routes/stripeWebhook.js
'use strict';

const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { User } = require('../models');
const sendConfirmationEmail = require('../Services/Emailsend');

// Focus NFe
const { nfseEnviar, nfseConsultar, nfseCancelar } = require('../lib/focus');
const { buildFromInvoice } = require('../lib/nfse-factory');

// Plans
const MONTHLY_PRICE_ID = process.env.STRIPE_PRICEID_MONTHLY;
const ANNUAL_PRICE_ID  = process.env.STRIPE_PRICEID_ANNUAL;

// util
function addDays(date, days) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

// emissão/consulta NFSe (assíncrono)
async function processaNFSe(ref, payload, tries = 6, delayMs = 10000) {
  try {
    const envio = await nfseEnviar(ref, payload);
    if (envio.status >= 400) {
      console.error('NFSe envio falhou', ref, envio);
      return;
    }
    let last = null;
    for (let i = 0; i < tries; i++) {
      await new Promise(r => setTimeout(r, delayMs));
      last = await nfseConsultar(ref, false);
      const s = last.data?.status;
      if (s === 'autorizado' || s === 'erro_autorizacao' || s === 'cancelado') break;
    }
    if (last?.data?.status === 'autorizado') {
      console.log('NFSe autorizada', ref, last.data?.numero, last.data?.url);
      // TODO: persista numero, serie, url, xml_path
    } else {
      console.error('NFSe não autorizada ou pendente', ref, last?.data);
    }
  } catch (e) {
    console.error('NFSe async error', ref, e);
  }
}

// resolução de usuário: metadata → e-mail → legado
async function resolverUsuarioPorStripe({ subscription, customer, invoice }) {
  // 1) metadata.userId em subscription ou customer
  const metaUserId =
    subscription?.metadata?.userId ||
    customer?.metadata?.userId ||
    null;

  if (metaUserId) {
    const byPk = await User.findByPk(metaUserId);
    if (byPk) return byPk;
  }

  // 2) e-mail do invoice ou do customer
  const email =
    invoice?.customer_email ||
    customer?.email ||
    customer?.invoice_settings?.email ||
    customer?.invoice_settings?.default_payment_method?.billing_details?.email ||
    null;

  if (email) {
    const byEmail = await User.findOne({ where: { email } });
    if (byEmail) return byEmail;
  }

  // 3) legado: stripeSubscriptionId
  const subId = subscription?.id || invoice?.subscription || null;
  if (subId) {
    const bySub = await User.findOne({ where: { stripeSubscriptionId: subId } });
    if (bySub) return bySub;
  }

  return null;
}

// webhook
router.post(
  '/',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error('Erro na verificação do webhook:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      // ————————————————————————————————————————————————————————————————
      // CRIAÇÃO DE CHECKOUT: atualiza VIP, grava IDs e metadata no Stripe
      // ————————————————————————————————————————————————————————————————
      case 'checkout.session.completed': {
        const session = event.data.object;

        const customerEmail =
          session.customer_email ||
          session.customer_details?.email ||
          null;

        const priceId =
          session.metadata?.priceId ||
          session.custom_fields?.find?.(f => f.key === 'priceId')?.text?.value ||
          null;

        if (!customerEmail || !priceId) {
          return res.status(400).send('Dados do cliente ou preço não encontrados');
        }

        try {
          const user = await User.findOne({ where: { email: customerEmail } });
          if (!user) return res.status(404).send('Usuário não encontrado');

          const now = new Date();
          const newExpiration =
            priceId === MONTHLY_PRICE_ID ? addDays(now, 30)
          : priceId === ANNUAL_PRICE_ID  ? addDays(now, 365)
          : null;

          if (!newExpiration) return res.status(400).send('Plano não reconhecido');

          await user.update({
            isVip: true,
            vipExpirationDate: newExpiration,
            stripeSubscriptionId: session.subscription || null,
            stripeCustomerId: session.customer || null,
          });

          // grava metadados estáveis no Stripe (chave por id interno)
          try {
            if (session.subscription) {
              await stripe.subscriptions.update(session.subscription, {
                metadata: { userId: String(user.id) }
              });
            }
            if (session.customer) {
              await stripe.customers.update(session.customer, {
                metadata: { userId: String(user.id) }
              });
            }
          } catch (e) {
            console.error('Falha ao atualizar metadata no Stripe', e);
          }

          await sendConfirmationEmail(customerEmail);
          return res.status(200).send({ received: true });
        } catch (err) {
          console.error('Erro ao atualizar usuário:', err);
          return res.status(500).send('Erro ao atualizar usuário');
        }
      }

      // ————————————————————————————————————————————————————————————————
      // FATURA PAGA: prorroga VIP, emite NFSe, usa resolução robusta do usuário
      // ————————————————————————————————————————————————————————————————
      case 'invoice.paid': {
        const invoice = event.data.object;

        const subscriptionId =
          invoice.subscription ||
          invoice.parent?.subscription_details?.subscription ||
          invoice.lines?.data?.[0]?.subscription ||
          null;

        if (!subscriptionId) {
          console.error('subscriptionId ausente no invoice.paid');
          return res.status(400).send('subscriptionId ausente no invoice.paid');
        }

        try {
          const subscription = await stripe.subscriptions.retrieve(
            subscriptionId,
            { expand: ['items.data.price', 'customer'] }
          );

          const customer =
            typeof subscription.customer === 'string'
              ? await stripe.customers.retrieve(subscription.customer)
              : subscription.customer;

          // resolve usuário: metadata → e-mail → legado
          const user = await resolverUsuarioPorStripe({ subscription, customer, invoice });
          if (!user) {
            console.error('Usuário não resolvido no invoice.paid');
            return res.status(404).send('Usuário não encontrado');
          }

          // identifica plano
          const priceId =
            subscription.items?.data?.[0]?.price?.id ||
            invoice.lines?.data?.[0]?.price?.id ||
            null;

          if (!priceId) {
            console.error('priceId não identificado no invoice.paid');
            return res.status(400).send('priceId não identificado');
          }

          let daysToAdd = null;
          if (priceId === MONTHLY_PRICE_ID) daysToAdd = 30;
          else if (priceId === ANNUAL_PRICE_ID) daysToAdd = 365;
          else {
            console.error('priceId não mapeado:', priceId);
            return res.status(400).send('Plano não reconhecido');
          }

          const now = new Date();
          const anchor =
            user.vipExpirationDate && new Date(user.vipExpirationDate) > now
              ? new Date(user.vipExpirationDate)
              : now;

          const newExpiration = addDays(anchor, daysToAdd);

          await user.update({
            isVip: true,
            vipExpirationDate: newExpiration,
            stripeSubscriptionId: subscriptionId,           // sincroniza
            stripeCustomerId: customer?.id || null,         // grava também
          });

          console.log(`VIP prorrogado (+${daysToAdd}d) para: ${user.email}`);

          // NFSe (assíncrono, idempotência por invoice.id)
          try {
            const payload = buildFromInvoice(invoice, customer);
            const ref = invoice.id;
            process.nextTick(() =>
              processaNFSe(ref, payload).catch(e => console.error('NFSe async error', e))
            );
          } catch (nfseErr) {
            console.error('Falha na preparação/envio da NFSe', nfseErr);
          }

          return res.status(200).send({ received: true });
        } catch (err) {
          console.error('Erro ao processar invoice.paid:', err);
          return res.status(500).send('Erro ao processar invoice.paid');
        }
      }

      // ————————————————————————————————————————————————————————————————
      // REEMBOLSO: cancela NFSe vinculada
      // ————————————————————————————————————————————————————————————————
      case 'charge.refunded':
      case 'refund.succeeded': {
        try {
          const obj = event.data.object;
          const ref = obj.invoice || obj.payment_intent;
          if (ref) {
            const r = await nfseCancelar(ref, 'Cancelamento por reembolso do pagamento no Stripe.');
            if (r.status === 200 && r.data?.status === 'cancelado') {
              console.log('NFSe cancelada por reembolso', ref);
            } else {
              console.error('Falha ao cancelar NFSe', ref, r);
            }
          }
          return res.status(200).send({ received: true });
        } catch (e) {
          console.error('Erro no cancelamento por reembolso', e);
          return res.status(500).send('Erro no cancelamento por reembolso');
        }
      }

      // ————————————————————————————————————————————————————————————————
      // CANCELAMENTO DE ASSINATURA: limpa vínculo local
      // ————————————————————————————————————————————————————————————————
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const stripeSubId = subscription.id;
        try {
          const user = await User.findOne({ where: { stripeSubscriptionId: stripeSubId } });
          if (user) {
            await user.update({ stripeSubscriptionId: null });
            console.log('Assinatura cancelada, VIP removido do usuário:', user.email);
          }
          return res.status(200).send({ received: true });
        } catch (err) {
          console.error('Erro ao processar cancelamento:', err);
          return res.status(500).send('Erro ao processar cancelamento');
        }
      }

      // ————————————————————————————————————————————————————————————————
      // SINCRONISMO EXTRA: cria/atualiza assinatura → grava metadata e ids
      // ————————————————————————————————————————————————————————————————
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        try {
          // garante metadata com userId quando já houver stripeCustomerId local
          const cust =
            typeof subscription.customer === 'string'
              ? await stripe.customers.retrieve(subscription.customer)
              : subscription.customer;

          const user = await resolverUsuarioPorStripe({ subscription, customer: cust });

          if (user) {
            // metadata idempotente
            try {
              await stripe.subscriptions.update(subscription.id, {
                metadata: { userId: String(user.id), ...(subscription.metadata || {}) }
              });
              if (cust?.id) {
                await stripe.customers.update(cust.id, {
                  metadata: { userId: String(user.id), ...(cust.metadata || {}) }
                });
              }
            } catch (metaErr) {
              console.error('Falha ao atualizar metadata no sync de assinatura', metaErr);
            }

            // vincula ids localmente
            await user.update({
              stripeSubscriptionId: subscription.id,
              stripeCustomerId: cust?.id || user.stripeCustomerId || null,
            });
          }

          return res.status(200).send({ received: true });
        } catch (err) {
          console.error('Erro no sync de assinatura:', err);
          return res.status(500).send('Erro no sync de assinatura');
        }
      }

      default: {
        console.log(`Evento não tratado: ${event.type}`);
        return res.status(200).send({ received: true });
      }
    }
  }
);

module.exports = router;
