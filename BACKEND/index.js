// server.js

'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const checkApiKey = require('./Middleware/CheckapiKey');
const db = require('./models'); // deve exportar { sequelize, ...models }

// Routers
const webhookRouter = require('./routes/stripewebhook'); // deve usar express.raw internamente
const reactionsRouter = require('./routes/Reactions');
const linkvertiseConfigRouter = require('./routes/linkvertiseConfig');
const userRouter = require('./routes/user');
const AsianRouter = require('./routes/AsianContent');
const payRouter = require('./routes/payment');
const VipRouter = require('./routes/Vip');
const Forgotpass = require('./routes/forgotpassword');
const ResetPasswordRouter = require('./routes/resetpassword');
const UpdateVipStatus = require('./routes/updatevipstatus');
const StatsRouter = require('./routes/stats');
const RequestsRouter = require('./routes/requests');
const recommendationsRouter = require('./routes/recommendations');
const authRoutes = require('./routes/authRoutes');
const renewVipRouter = require('./routes/Renewvip');
const cancelsubscriptionRouter = require('./routes/Cancelsubscription');
const filterOptionsRoutes = require('./routes/FilterOptions');
const stripeCustomerPortalRouter = require('./routes/stripeCustomerPortal');
const bannedContentRouter = require('./routes/BannedContent');
const unknownContentRouter = require('./routes/UnknownContent');
const WesternRouter = require('./routes/WesternContent');
const VipAsianRouter = require('./routes/VipAsianContent');
const VipWesternRouter = require('./routes/VipWesternContent');
const VipBannedRouter = require('./routes/VipBannedContent');
const VipUnknownRouter = require('./routes/VipUnknownContent');
const universalSearchRouter = require('./routes/UniversalSearch');

const app = express();

// Proxy
app.set('trust proxy', 1);

// CORS com lista branca estrita
const allowlist = [process.env.FRONTEND_URL, process.env.APP_ORIGIN_2, process.env.APP_ORIGIN_3].filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // clientes nativos/healthchecks
    if (allowlist.includes(origin)) return cb(null, true);
    return cb(new Error('Origin não autorizado'), false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
}));

// Rate limit ANTES das rotas
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Ip bloqueado.'
}));

// Bloqueio de domínios referenciadores
app.use((req, res, next) => {
  const referer = req.headers.referer || '';
  const origin = req.headers.origin || '';
  const blockedHosts = ['bypass.city'];
  if (blockedHosts.some(h => referer.includes(h) || origin.includes(h))) {
    return res.status(403).json({ message: 'You are blocked' });
  }
  next();
});

/**
 * Stripe webhook: deve ser montado ANTES do express.json().
 * Observação: dentro do arquivo ./routes/stripewebhook,
 * utilize: router.post('/', express.raw({ type: 'application/json' }), handler)
 */
app.use('/webhook', webhookRouter);

// Body parser para demais rotas
app.use(express.json());

// Filtro simples de user-agent
app.use((req, res, next) => {
  const ua = req.headers['user-agent'] || '';
  if (/curl|wget|bot|spider/i.test(ua)) return res.status(403).send('Forbidden');
  next();
});

// Bloqueios por padrão de URL
app.use((req, res, next) => {
  const url = decodeURIComponent(req.originalUrl);
  const bloqueios = [/\.bak$/i, /\.old$/i, /nice ports/i, /trinity/i, /\.git/i, /\.env/i, /wp-admin/i, /phpmyadmin/i];
  if (bloqueios.some(rx => rx.test(url))) return res.status(403).send('Access denied.');
  next();
});

// Rotas sem chave
app.use('/pay', payRouter);
app.use('/cancel-subscription', cancelsubscriptionRouter);
app.use('/forgot-password', Forgotpass);
app.use('/reset-password', ResetPasswordRouter);
app.use('/recommendations', recommendationsRouter);
app.use('/filteroptions', filterOptionsRoutes);
app.use('/stripe-portal', stripeCustomerPortalRouter);
app.use('/linkvertise-config', linkvertiseConfigRouter);

// Rotas /auth consolidadas em uma base
app.use('/auth', userRouter, authRoutes, renewVipRouter);

// Rotas protegidas por API key
app.use('/vipcontent', checkApiKey, VipRouter);
app.use('/update-vip-status', checkApiKey, UpdateVipStatus);
app.use('/api/stats', checkApiKey, StatsRouter);
app.use('/admin/requests', checkApiKey, RequestsRouter);
app.use('/westerncontent', checkApiKey, WesternRouter);
app.use('/asiancontent', checkApiKey, AsianRouter);
app.use('/bannedcontent', checkApiKey, bannedContentRouter);
app.use('/unknowncontent', checkApiKey, unknownContentRouter);
app.use('/vip-asiancontent', checkApiKey, VipAsianRouter);
app.use('/vip-westerncontent', checkApiKey, VipWesternRouter);
app.use('/vip-bannedcontent', checkApiKey, VipBannedRouter);
app.use('/vip-unknowncontent', checkApiKey, VipUnknownRouter);
app.use('/universal-search', checkApiKey, universalSearchRouter);

// Boot do servidor com Sequelize ÚNICO
(async () => {
  try {
    // Apenas Sequelize. Não criar pg.Pool aqui.
    await db.sequelize.authenticate();

    // Log seguro de ambiente de banco
    try {
      const dsn = process.env.POSTGRES_URL || '';
      const u = new URL(dsn);
      const host = u.hostname || '?';
      const database = (u.pathname || '').replace('/', '') || '?';
      const sslmode = u.searchParams.get('sslmode') || (process.env.PGSSL === 'true' ? 'require' : 'n/a');
      const poolMax = (db.sequelize?.options?.pool?.max != null) ? db.sequelize.options.pool.max : 'n/a';
      console.log(`[DB] Conexão ativa em produção | host=${host} database=${database} sslmode=${sslmode} pool.max=${poolMax}`);
    } catch {
      console.log('[DB] Conexão ativa em produção | DSN parse indisponível');
    }

    // Em produção, preferir migrações. Controle por variável.
    if (process.env.USE_SYNC === 'true') {
      const alter = process.env.SYNC_ALTER === 'true';
      await db.sequelize.sync({ alter });
      console.log(`[DB] Sync executado | alter=${alter}`);
    }

    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}...`);
    });
  } catch (err) {
    console.error('Erro ao conectar ao banco de dados Sequelize:', err.message);
    process.exit(1);
  }
})();

module.exports = app;
