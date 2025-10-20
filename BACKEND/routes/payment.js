const express = require('express');
const { User } = require('../models');
const stripeService = require('../Services/StripeService');

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

        const stripeVersion = stripeService.getDefaultVersion();
        const stripe = stripeService.getClient(stripeVersion);
        const priceId = stripeService.getPriceId(stripeVersion, planType);

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer_email: email,
            line_items: [
              {
                price: priceId,
                quantity: 1,
              },
            ],
            mode: 'subscription',
            success_url: `${process.env.FRONTEND_URL}/success`,
            cancel_url: `${process.env.FRONTEND_URL}/cancel`,
            metadata: {
              priceId: priceId,
              stripeVersion: stripeVersion,
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
