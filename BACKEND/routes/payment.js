const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { User } = require('../models');

const router = express.Router();

router.post('/vip-payment', async (req, res) => {
    const { email, planType } = req.body;

    if (!email || !planType || !['monthly', 'annual'].includes(planType)) {
        return res.status(400).json({ error: 'Dados inválidos. Verifique o email e o tipo de plano.' });
    }

    try {
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(403).json({ error: 'Este e-mail não está autorizado para pagamento.' });
        }

        const prices = {
            monthly: process.env.STRIPE_PRICEID_MONTHLY,
            annual: process.env.STRIPE_PRICEID_ANNUAL,
        };

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer_email: email,
            line_items: [
              {
                price: prices[planType],
                quantity: 1,
              },
            ],
            mode: 'subscription',
            success_url: `${process.env.FRONTEND_URL}/success`,
            cancel_url: `${process.env.FRONTEND_URL}/cancel`,
            metadata: {
              priceId: prices[planType],
            },
          });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Erro ao criar sessão de checkout:', error.message, error.stack);
        res.status(500).json({ error: 'Erro ao criar sessão de checkout' });
    }
});

//

module.exports = router;