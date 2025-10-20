const express = require('express');
const router = express.Router();
const { User } = require('../models');
const bodyParser = require('body-parser');
const sendConfirmationEmail = require('../Services/Emailsend');
const stripeService = require('../Services/StripeService');

router.post(
  '/',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];

    let event;
    let stripeVersion = null;

    for (const version of ['v1', 'v2']) {
      try {
        const endpointSecret = stripeService.getWebhookSecret(version);
        const stripe = stripeService.getClient(version);
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        stripeVersion = version;
        break;
      } catch (err) {
        continue;
      }
    }

    if (!event || !stripeVersion) {
      console.error('⚠️ Erro na verificação do webhook: assinatura inválida para ambas as contas');
      return res.status(400).send('Webhook Error: Invalid signature');
    }

    console.log(`✅ Webhook recebido da conta Stripe ${stripeVersion}: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const customerEmail = session.customer_email;
        const priceId = session.metadata?.priceId;
        const sessionStripeVersion = session.metadata?.stripeVersion || stripeVersion;

        if (!customerEmail || !priceId) {
          return res.status(400).send('Dados do cliente ou preço não encontrados');
        }

        try {
          const user = await User.findOne({ where: { email: customerEmail } });
          if (!user) return res.status(404).send('Usuário não encontrado');

          const now = new Date();
          let newExpiration = new Date(now);

          const monthlyPriceV1 = process.env.STRIPE_PRICEID_MONTHLY;
          const annualPriceV1 = process.env.STRIPE_PRICEID_ANNUAL;
          const monthlyPriceV2 = process.env.STRIPE_PRICEID_MONTHLY_V2;
          const annualPriceV2 = process.env.STRIPE_PRICEID_ANNUAL_V2;

          if (priceId === monthlyPriceV1 || priceId === monthlyPriceV2) {
            newExpiration.setDate(now.getDate() + 30);
          } else if (priceId === annualPriceV1 || priceId === annualPriceV2) {
            newExpiration.setDate(now.getDate() + 365);
          } else {
            return res.status(400).send('Plano não reconhecido');
          }

          await user.update({
            isVip: true,
            vipExpirationDate: newExpiration,
            stripeSubscriptionId: session.subscription || null,
            stripeAccountVersion: sessionStripeVersion,
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
  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;

  try {
    const stripe = stripeService.getClient(stripeVersion);
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const priceId = subscription.items.data[0].price.id;

    const user = await User.findOne({ where: { stripeSubscriptionId: subscriptionId } });

    if (!user) {
      console.error('Usuário com assinatura não encontrado para invoice.paid');
      return res.status(404).send('Usuário não encontrado');
    }

    const now = new Date();
    let newExpiration = new Date(now);

    const monthlyPriceV1 = process.env.STRIPE_PRICEID_MONTHLY;
    const annualPriceV1 = process.env.STRIPE_PRICEID_ANNUAL;
    const monthlyPriceV2 = process.env.STRIPE_PRICEID_MONTHLY_V2;
    const annualPriceV2 = process.env.STRIPE_PRICEID_ANNUAL_V2;

    if (priceId === monthlyPriceV1 || priceId === monthlyPriceV2) {
      newExpiration.setDate(now.getDate() + 30);
    } else if (priceId === annualPriceV1 || priceId === annualPriceV2) {
      newExpiration.setDate(now.getDate() + 365);
    } else {
      console.error('Plano não reconhecido para invoice.paid');
      return res.status(400).send('Plano desconhecido');
    }

    await user.update({
      isVip: true,
      vipExpirationDate: newExpiration,
    });

    console.log(`✅ VIP atualizado após pagamento de invoice para: ${user.email} (conta ${stripeVersion})`);
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