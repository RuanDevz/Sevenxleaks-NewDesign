const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { User } = require('../models');

const router = express.Router();

router.post('/vip-payment', async (req, res) => {
    const { email, planType, vipTier } = req.body;

    if (!email || !vipTier) {
        return res.status(400).json({ error: 'Dados inválidos. Verifique o email e tier VIP.' });
    }

    if (!['diamond', 'titanium', 'vitality'].includes(vipTier)) {
        return res.status(400).json({ error: 'Tier VIP inválido. Use "diamond", "titanium" ou "vitality".' });
    }

    if (vipTier !== 'vitality' && !planType) {
        return res.status(400).json({ error: 'Tipo de plano é obrigatório para Diamond e Titanium.' });
    }

    if (vipTier !== 'vitality' && !['monthly', 'annual'].includes(planType)) {
        return res.status(400).json({ error: 'Tipo de plano inválido. Use "monthly" ou "annual".' });
    }

    try {
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(403).json({ error: 'Este e-mail não está autorizado para pagamento.' });
        }

        let session;

        if (vipTier === 'vitality') {
            // Vitality: Pagamento único (lifetime)
            const priceId = process.env.STRIPE_PRICEID_VITALITY;

            if (!priceId) {
                return res.status(500).json({ error: 'Price ID do Vitality não configurado.' });
            }

            session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                customer_email: email,
                line_items: [
                    {
                        price: priceId,
                        quantity: 1,
                    },
                ],
                mode: 'payment', // Pagamento único
                success_url: `${process.env.FRONTEND_URL}/success`,
                cancel_url: `${process.env.FRONTEND_URL}/cancel`,
                metadata: {
                    priceId: priceId,
                    vipTier: 'vitality',
                    subscriptionType: 'lifetime',
                },
            });
        } else {
            // Diamond e Titanium: Subscription
            const prices = {
                diamond_monthly: process.env.STRIPE_PRICEID_MONTHLY,
                diamond_annual: process.env.STRIPE_PRICEID_ANNUAL,
                titanium_monthly: process.env.STRIPE_PRICEID_TITANIUM_MONTHLY,
                titanium_annual: process.env.STRIPE_PRICEID_TITANIUM_ANNUAL,
            };

            const priceKey = `${vipTier}_${planType}`;
            const priceId = prices[priceKey];

            if (!priceId) {
                return res.status(400).json({ error: 'Combinação de plano não encontrada.' });
            }

            session = await stripe.checkout.sessions.create({
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
                    vipTier: vipTier,
                    subscriptionType: planType,
                },
            });
        }

        res.json({ url: session.url });
    } catch (error) {
        console.error('Erro ao criar sessão de checkout:', error.message, error.stack);
        res.status(500).json({ error: 'Erro ao criar sessão de checkout' });
    }
});

module.exports = router;
