const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { User } = require('../models');

const router = express.Router();

const stripeCPF = require('stripe')(process.env.STRIPE_SECRET_KEY);
const stripePJ  = require('stripe')(process.env.SECONDARY_STRIPE_SECRET_KEY);

router.post('/vip-payment', async (req, res) => {
  const { email, planType } = req.body;

  const pricesCPF = {
    monthly: process.env.STRIPE_PRICEID_MONTHLY,
    annual: process.env.STRIPE_PRICEID_ANNUAL,
  };
  const pricesPJ = {
    monthly: process.env.SECONDARY_STRIPE_PRICEID_MONTHLY,
    annual: process.env.SECONDARY_STRIPE_PRICEID_ANNUAL,
  };

  const user = await User.findOne({ where: { email } }); // valide autorização
  const isNovaVenda = true; // sua regra: novos clientes, data, flag, etc.

  const stripe = isNovaVenda ? stripePJ : stripeCPF;
  const priceId = isNovaVenda ? pricesPJ[planType] : pricesCPF[planType];

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    customer_email: email,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: `${process.env.FRONTEND_URL}/success`,
    cancel_url: `${process.env.FRONTEND_URL}/cancel`,
    metadata: { priceId, account: isNovaVenda ? 'PJ' : 'CPF' }
  });

  return res.json({ url: session.url });
});

module.exports = router;
