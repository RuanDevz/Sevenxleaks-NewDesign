const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { User } = require('../models');
const bodyParser = require('body-parser');
const sendConfirmationEmail = require('../Services/Emailsend')

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

          if (priceId === process.env.STRIPE_PRICEID_MONTHLY) {
            newExpiration.setDate(now.getDate() + 30);
          } else if (priceId === process.env.STRIPE_PRICEID_ANNUAL) {
            newExpiration.setDate(now.getDate() + 365);
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

  // Extrair ID da assinatura considerando mudanças no schema
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
    // Buscar a assinatura para dados canônicos do período e price
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // priceId direto da assinatura ou, em fallback, da invoice line
    const priceId =
      subscription.items?.data?.[0]?.price?.id ||
      invoice.lines?.data?.[0]?.pricing?.price_details?.price ||
      null;

    if (!priceId) {
      console.error('priceId não identificado no invoice.paid');
      return res.status(400).send('priceId não identificado');
    }

    // Localizar usuário pela assinatura; se falhar, tentar por customer
    let user =
      await User.findOne({ where: { stripeSubscriptionId: subscriptionId } });

    if (!user) {
      // Fallbacks opcionais se você mantiver estes campos no seu modelo:
      // 1) por stripeCustomerId, se existir na sua base
      // 2) por e-mail da fatura
      const byCustomer =
        invoice.customer && await User.findOne({ where: { stripeCustomerId: invoice.customer } });
      const byEmail =
        !byCustomer && invoice.customer_email
          ? await User.findOne({ where: { email: invoice.customer_email } })
          : null;
      user = byCustomer || byEmail;

      if (!user) {
        console.error('Usuário com assinatura não encontrado para invoice.paid');
        return res.status(404).send('Usuário não encontrado');
      }

      // Opcional: consolidar o vínculo se achado por fallback
      if (!user.stripeSubscriptionId) {
        await user.update({ stripeSubscriptionId: subscriptionId });
      }
    }

    // Definir validade usando o fim do período atual da assinatura
    // Evita suposições de 30/365 e respeita proration e interval_count
    const periodEnd = subscription.current_period_end; // epoch seconds
    const newExpiration = new Date(periodEnd * 1000);

    await user.update({
      isVip: true,
      vipExpirationDate: newExpiration,
    });

    console.log(`VIP atualizado após invoice.paid para: ${user.email}`);
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