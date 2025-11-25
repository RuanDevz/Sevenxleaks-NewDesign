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

// Plans (mantidos caso precise em outros fluxos)
const MONTHLY_PRICE_ID = process.env.STRIPE_PRICEID_MONTHLY;
const ANNUAL_PRICE_ID  = process.env.STRIPE_PRICEID_ANNUAL;

// util
function toDateFromUnix(ts) {
  return ts ? new Date(ts * 1000) : null;
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
      // TODO: persistir numero, serie, url, xml_path
    } else {
      console.error('NFSe não autorizada ou pendente', ref, last?.data);
    }
  } catch (e) {
    console.error('NFSe async error', ref, e);
  }
}

// resolução de usuário: metadata → e-mail → legado
async function resolverUsuarioPorStripe({ subscription, customer, invoice }) {
  const metaUserId =
    subscription?.metadata?.userId ||
    customer?.metadata?.userId ||
    null;

  if (metaUserId) {
    const byPk = await User.findByPk(metaUserId);
    if (byPk) return byPk;
  }

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
      // CHECKOUT CONCLUÍDO:
      // - Para lifetime (payment mode): ativar VIP imediatamente com 999999 dias
      // - Para outros (subscription mode): apenas vincular IDs e metadata
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

          // Extrair tier e tipo de subscrição dos metadados
          const vipTier = session.metadata?.vipTier || 'diamond';
          const subscriptionType = session.metadata?.subscriptionType || 'monthly';

          // Verificar se é lifetime (pagamento único - mode: 'payment')
          if (vipTier === 'lifetime' && session.mode === 'payment' && session.payment_status === 'paid') {
            // lifetime: ativar VIP imediatamente com 999999 dias
            const now = new Date();
            const lifetimeExpiration = new Date(now.getTime() + (999999 * 24 * 60 * 60 * 1000));
            const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

            await user.update({
              isVip: true,
              vipExpirationDate: lifetimeExpiration,
              stripeCustomerId: session.customer || user.stripeCustomerId || null,
              vipTier: 'lifetime',
              subscriptionType: 'lifetime',
              requestTickets: 2,
              requestTicketsResetDate: resetDate,
            });

            console.log(`VIP lifetime (lifetime) ativado para: ${user.email}`);

            // NFSe para lifetime
            try {
              const customer = session.customer
                ? await stripe.customers.retrieve(session.customer)
                : null;
              const fakeInvoice = {
                id: session.id,
                amount_paid: session.amount_total,
                currency: session.currency,
                customer_email: customerEmail,
              };
              const payload = buildFromInvoice(fakeInvoice, customer);
              process.nextTick(() =>
                processaNFSe(session.id, payload).catch(e => console.error('NFSe async error', e))
              );
            } catch (nfseErr) {
              console.error('Falha na preparação/envio da NFSe', nfseErr);
            }
          } else {
            // Outros planos: apenas vincule IDs. NÃO atualize isVip/vipExpirationDate aqui.
            await user.update({
              stripeSubscriptionId: session.subscription || user.stripeSubscriptionId || null,
              stripeCustomerId: session.customer || user.stripeCustomerId || null,
              vipTier: vipTier,
              subscriptionType: subscriptionType,
            });

            // Escreve metadados estáveis no Stripe
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
          }

          // E-mail de confirmação
          await sendConfirmationEmail(customerEmail);
          return res.status(200).send({ received: true });
        } catch (err) {
          console.error('Erro ao tratar checkout.session.completed:', err);
          return res.status(500).send('Erro ao tratar checkout.session.completed');
        }
      }

      // ————————————————————————————————————————————————————————————————
      // FATURA PAGA: única fonte de verdade para concessão/renovação de VIP
      // Define expiração = current_period_end da assinatura
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

          const user = await resolverUsuarioPorStripe({ subscription, customer, invoice });
          if (!user) {
            console.error('Usuário não resolvido no invoice.paid');
            return res.status(404).send('Usuário não encontrado');
          }

          // Determinar tier e tipo de subscrição
          const vipTier = subscription.metadata?.vipTier || user.vipTier || 'diamond';
          const subscriptionType = subscription.metadata?.subscriptionType || user.subscriptionType || 'monthly';

          // Verificar se é plano lifetime (lifetime)
          let newExpiration;
          let requestTickets = 0;

          if (vipTier === 'lifetime') {
            // Plano vitalício: adicionar 999999 dias a partir de agora
            const now = new Date();
            newExpiration = new Date(now.getTime() + (999999 * 24 * 60 * 60 * 1000));
            requestTickets = 10;
          } else {
            // Planos normais: usar o período oficial da Stripe
            const periodEnd = toDateFromUnix(subscription.current_period_end);
            if (!periodEnd) {
              console.error('current_period_end ausente na assinatura');
              return res.status(400).send('Período da assinatura indisponível');
            }

            // Não reduzir validade se houver data futura maior já registrada
            const currentExp = user.vipExpirationDate ? new Date(user.vipExpirationDate) : null;
            newExpiration = currentExp && currentExp > periodEnd ? currentExp : periodEnd;

            // Determinar quantidade de tickets baseado no tier
            if (vipTier === 'diamond') {
              requestTickets = subscriptionType === 'annual' ? 2 : 1;
            } else if (vipTier === 'titanium') {
              requestTickets = 5;
            }
          }

          // Definir data de reset dos tickets (próximo mês)
          const now = new Date();
          const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

          await user.update({
            isVip: true,
            vipExpirationDate: newExpiration,
            stripeSubscriptionId: subscriptionId,
            stripeCustomerId: customer?.id || user.stripeCustomerId || null,
            vipTier: vipTier,
            subscriptionType: subscriptionType,
            requestTickets: requestTickets,
            requestTicketsResetDate: resetDate,
          });

          console.log(`VIP definido até ${newExpiration.toISOString()} para: ${user.email}`);

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
      // SINCRONISMO: garante metadata e IDs em create/update de assinatura
      // ————————————————————————————————————————————————————————————————
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        try {
          const cust =
            typeof subscription.customer === 'string'
              ? await stripe.customers.retrieve(subscription.customer)
              : subscription.customer;

          const user = await resolverUsuarioPorStripe({ subscription, customer: cust });

          if (user) {
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
