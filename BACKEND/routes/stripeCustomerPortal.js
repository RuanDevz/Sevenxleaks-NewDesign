const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const stripeCPF = Stripe(process.env.STRIPE_SECRET_KEY);
const stripePJ  = Stripe(process.env.SECONDARY_STRIPE_SECRET_KEY);
const { User } = require('../models');
const Authmiddleware = require('../Middleware/Auth');

// Criar sessão do Customer Portal (suporte a duas contas)
router.post('/create-portal-session', Authmiddleware, async (req, res) => {
  try {
    const decodedUser = req.user;

    // Buscar usuário
    const user = await User.findOne({ where: { id: decodedUser.id } });
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar assinatura
    if (!user.stripeSubscriptionId) {
      return res.status(400).json({ error: 'Nenhuma assinatura ativa encontrada' });
    }

    // Seleção da conta Stripe
    let stripe = null;

    // 1) Preferir campo persistido, se existir
    if (user.stripeAccount === 'PJ') stripe = stripePJ;
    else if (user.stripeAccount === 'CPF') stripe = stripeCPF;

    // 2) Fallback: tentativa pela assinatura (robustez caso não tenha `stripeAccount`)
    if (!stripe) {
      try {
        await stripeCPF.subscriptions.retrieve(user.stripeSubscriptionId);
        stripe = stripeCPF;
      } catch {
        try {
          await stripePJ.subscriptions.retrieve(user.stripeSubscriptionId);
          stripe = stripePJ;
        } catch (e) {
          return res.status(404).json({ error: 'Assinatura não encontrada em nenhuma conta' });
        }
      }
    }

    // Buscar customer da assinatura na conta identificada
    const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
    const customerId = subscription.customer;

    // Criar sessão do Portal
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.FRONTEND_URL}/account`,
    });

    return res.status(200).json({
      url: session.url,
      message: 'Sessão do portal criada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao criar sessão do portal:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor ao criar sessão do portal'
    });
  }
});

module.exports = router;
