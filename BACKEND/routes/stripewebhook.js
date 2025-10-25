const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const stripeCPF = Stripe(process.env.STRIPE_SECRET_KEY);
const stripePJ  = Stripe(process.env.SECONDARY_STRIPE_SECRET_KEY);
const { User } = require('../models');
const bodyParser = require('body-parser'); // mantido conforme seu código atual
const sendConfirmationEmail = require('../Services/Emailsend');

// Segredos de webhook por conta
const whsecCPF = process.env.STRIPE_WEBHOOK_SECRET;
const whsecPJ  = process.env.SECONDARY_STRIPE_WEBHOOK_SECRET;

router.post(
  '/',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];

    let event;
    let origin = null;         // 'CPF' | 'PJ'
    let stripe = null;         // SDK correto por origem

    // 1) Verificação de assinatura contra AMBAS as contas
    try {
      event  = Stripe.webhooks.constructEvent(req.body, sig, whsecCPF);
      origin = 'CPF';
      stripe = stripeCPF;
    } catch (errCPF) {
      try {
        event  = Stripe.webhooks.constructEvent(req.body, sig, whsecPJ);
        origin = 'PJ';
        stripe = stripePJ;
      } catch (errPJ) {
        console.error('⚠️ Erro na verificação do webhook:', errPJ.message);
        return res.status(400).send(`Webhook Error: ${errPJ.message}`);
      }
    }

    // 2) Mapear IDs de preço conforme origem
    const PRICE_MONTHLY   = origin === 'PJ'
      ? process.env.SECONDARY_STRIPE_PRICEID_MONTHLY
      : process.env.STRIPE_PRICEID_MONTHLY;

    const PRICE_ANNUAL    = origin === 'PJ'
      ? process.env.SECONDARY_STRIPE_PRICEID_ANNUAL
      : process.env.STRIPE_PRICEID_ANNUAL;

    // 3) Processamento de eventos
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const customerEmail = session.customer_email;
        const priceId = session.metadata?.priceId;

        if (!customerEmail || !priceId) {
          return res.status(400).send('Dados do cliente ou preço não encontrados');
        }

        try {
          const user = await User.findOne({ where: { email: customerEmail } });
          if (!user) return res.status(404).send('Usuário não encontrado');

          const now = new Date();
          let newExpiration = new Date(now);

          if (priceId === PRICE_MONTHLY) {
            newExpiration.setDate(now.getDate() + 30);
          } else if (priceId === PRICE_ANNUAL) {
            newExpiration.setDate(now.getDate() + 365);
          } else {
            return res.status(400).send('Plano não reconhecido');
          }

          await user.update({
            isVip: true,
            vipExpirationDate: newExpiration,
            stripeSubscriptionId: session.subscription || null,
            // opcional: se existir coluna stripeAccount no seu modelo, você pode gravar:
            // stripeAccount: origin
          });

          await sendConfirmationEmail(customerEmail);
        } catch (err) {
          console.error('Erro ao atualizar usuário:', err);
          return res.status(500).send('Erro ao atualizar usuário');
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;

        try {
          // recuperar a assinatura na CONTA de origem
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = subscription.items.data[0].price.id;

          const user = await User.findOne({ where: { stripeSubscriptionId: subscriptionId } });

          if (!user) {
            console.error('Usuário com assinatura não encontrado para invoice.paid');
            return res.status(404).send('Usuário não encontrado');
          }

          const now = new Date();
          let newExpiration = new Date(now);

          if (priceId === PRICE_MONTHLY) {
            newExpiration.setDate(now.getDate() + 30);
          } else if (priceId === PRICE_ANNUAL) {
            newExpiration.setDate(now.getDate() + 365);
          } else {
            console.error('Plano não reconhecido para invoice.paid');
            return res.status(400).send('Plano desconhecido');
          }

          await user.update({
            isVip: true,
            vipExpirationDate: newExpiration,
            // opcional: se existir a coluna
            // stripeAccount: origin
          });

          console.log(`✅ VIP atualizado após pagamento de invoice para: ${user.email}`);
          return res.status(200).send({ received: true });

        } catch (err) {
          console.error('Erro ao processar invoice.paid:', err);
          return res.status(500).send('Erro ao processar invoice.paid');
        }
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const stripeSubId = subscription.id;

        try {
          const user = await User.findOne({ where: { stripeSubscriptionId: stripeSubId } });
          if (user) {
            await user.update({
              stripeSubscriptionId: null,
            });
            console.log('❌ Assinatura cancelada, VIP removido do usuário:', user.email);
          }
        } catch (err) {
          console.error('Erro ao processar cancelamento:', err);
        }
        break;
      }

      default:
        console.log(`Evento não tratado: ${event.type}`);
    }

    // resposta padrão quando não houve retorno antecipado
    res.status(200).send({ received: true, origin });
  }
);

module.exports = router;
