const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { User } = require('../models');
const bodyParser = require('body-parser');
const sendConfirmationEmail = require('../Services/Emailsend');

const MONTHLY_PRICE_ID = process.env.STRIPE_PRICEID_MONTHLY;
const ANNUAL_PRICE_ID  = process.env.STRIPE_PRICEID_ANNUAL;

function addDays(date, days) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

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
      console.error('⚠️ Erro na verificação do webhook:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

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

          if (priceId === MONTHLY_PRICE_ID) {
            newExpiration.setUTCDate(now.getUTCDate() + 30);
          } else if (priceId === ANNUAL_PRICE_ID) {
            newExpiration.setUTCDate(now.getUTCDate() + 365);
          } else {
            return res.status(400).send('Plano não reconhecido');
          }

          await user.update({
            isVip: true,
            vipExpirationDate: newExpiration,
            stripeSubscriptionId: session.subscription || null,
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

        // subscriptionId canônico
        const subscriptionId =
          invoice.subscription ||
          invoice.parent?.subscription_details?.subscription ||
          invoice.lines?.data?.[0]?.parent?.subscription_item_details?.subscription ||
          null;

        if (!subscriptionId) {
          console.error('subscriptionId ausente no invoice.paid');
          return res.status(400).send('subscriptionId ausente no invoice.paid');
        }

        try {
          // Obter priceId da assinatura (preferencial) ou da invoice (fallback)
          const subscription = await stripe.subscriptions.retrieve(subscriptionId, { expand: ['items.data.price'] });

          const priceId =
            subscription.items?.data?.[0]?.price?.id ||
            invoice.lines?.data?.[0]?.price?.id ||
            null;

          if (!priceId) {
            console.error('priceId não identificado no invoice.paid');
            return res.status(400).send('priceId não identificado');
          }

          // Localizar usuário somente por subscriptionId, conforme diretriz
          const user = await User.findOne({ where: { stripeSubscriptionId: subscriptionId } });
          if (!user) {
            console.error('Usuário com assinatura não encontrado para invoice.paid');
            return res.status(404).send('Usuário não encontrado');
          }

          // Determinar dias a acrescer: 30 mensal, 365 anual
          let daysToAdd = null;
          if (priceId === MONTHLY_PRICE_ID) daysToAdd = 30;
          else if (priceId === ANNUAL_PRICE_ID) daysToAdd = 365;
          else {
            console.error('priceId não mapeado nas variáveis de ambiente:', priceId);
            return res.status(400).send('Plano não reconhecido');
          }

          // Prorrogar a partir do maior entre agora e o já vigente
          const now = new Date();
          const anchor = user.vipExpirationDate && new Date(user.vipExpirationDate) > now
            ? new Date(user.vipExpirationDate)
            : now;

          const newExpiration = addDays(anchor, daysToAdd);

          await user.update({
            isVip: true,
            vipExpirationDate: newExpiration,
          });

          console.log(`VIP prorrogado (+${daysToAdd}d) para: ${user.email}`);
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

    res.status(200).send({ received: true });
  }
);

module.exports = router;
