const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { User } = require('../models');
const Authmiddleware = require('../Middleware/Auth');

// Criar sessão do Customer Portal
router.post('/create-portal-session', Authmiddleware, async (req, res) => {
  try {
    const decodedUser = req.user;
    
    // Buscar o usuário no banco de dados
    const user = await User.findOne({ where: { id: decodedUser.id } });
    
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar se o usuário tem uma assinatura ativa
    if (!user.stripeSubscriptionId) {
      return res.status(400).json({ error: 'Nenhuma assinatura ativa encontrada' });
    }

    // Buscar o customer_id da assinatura
    const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
    const customerId = subscription.customer;

    // Criar sessão do portal
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