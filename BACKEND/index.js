// index.js

'use strict';

const express = require('express');
const cors = require('cors');
const db = require('./models');
require('dotenv').config();
const { Pool } = require('pg');
const serverless = require('serverless-http');
const rateLimit = require('express-rate-limit');

// ===== App =====
const app = express();
app.set('trust proxy', 1);

// ===== CORS (compatível com credenciais) =====
// Observação: não fixar '*' quando credentials: true.
// Permitir subdomínios *.vercel.app e domínios autorizados.
const allowedOrigins = [
  'https://sevenxleaks.com',
  'http://localhost:5173',
  'https://newdesign-livid.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Postman, apps móveis
    if (
      allowedOrigins.includes(origin) ||
      /\.vercel\.app$/.test(new URL(origin).hostname)
    ) {
      return callback(null, true);
    }
    // Opcional: negar explicitamente
    return callback(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Preflight genérico
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, x-admin-key');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ===== Bloqueio por referer/origin =====
app.use((req, res, next) => {
  const referer = req.headers.referer || '';
  const origin = req.headers.origin || '';
  const blockedDomains = ['https://bypass.city/'];
  if (blockedDomains.some(d => referer.includes(d) || origin.includes(d))) {
    return res.status(403).json({ message: 'You are blocked' });
  }
  next();
});

// ===== Stripe webhook ANTES do body parser JSON =====
const webhookRouter = require('./routes/stripewebhook');
app.use('/webhook', webhookRouter);

// Body parser para as demais rotas
app.use((req, res, next) => {
  if (req.originalUrl === '/webhook') return next();
  return express.json()(req, res, next);
});

// ===== Import de rotas =====
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
const checkApiKey = require('./Middleware/CheckapiKey');
const WesternRouter = require('./routes/WesternContent');
const VipAsianRouter = require('./routes/VipAsianContent');
const VipWesternRouter = require('./routes/VipWesternContent');
const VipBannedRouter = require('./routes/VipBannedContent');
const VipUnknownRouter = require('./routes/VipUnknownContent');
const universalSearchRouter = require('./routes/UniversalSearch');

// ===== Montagem das rotas =====
app.use('/auth', userRouter);
app.use('/cancel-subscription', cancelsubscriptionRouter);
app.use('/reactions', reactionsRouter);
app.use('/auth', authRoutes);
app.use('/vipcontent', checkApiKey, VipRouter);
app.use('/pay', payRouter);
app.use('/forgot-password', Forgotpass);
app.use('/reset-password', ResetPasswordRouter);
app.use('/update-vip-status', checkApiKey, UpdateVipStatus);
app.use('/api/stats', checkApiKey, StatsRouter);
app.use('/admin/requests', checkApiKey, RequestsRouter);
app.use('/recommendations', recommendationsRouter);
app.use('/auth', renewVipRouter);
app.use('/filteroptions', filterOptionsRoutes);
app.use('/linkvertise-config', linkvertiseConfigRouter);
app.use('/stripe-portal', stripeCustomerPortalRouter);

app.use('/westerncontent', checkApiKey, WesternRouter);
app.use('/asiancontent', checkApiKey, AsianRouter);
app.use('/bannedcontent', checkApiKey, bannedContentRouter);
app.use('/unknowncontent', checkApiKey, unknownContentRouter);
app.use('/vip-asiancontent', checkApiKey, VipAsianRouter);
app.use('/vip-westerncontent', checkApiKey, VipWesternRouter);
app.use('/vip-bannedcontent', checkApiKey, VipBannedRouter);
app.use('/vip-unknowncontent', checkApiKey, VipUnknownRouter);
app.use('/universal-search', checkApiKey, universalSearchRouter);

// ===== Rate limit =====


// ===== Bloqueio por user-agent =====
app.use((req, res, next) => {
  const ua = req.headers['user-agent'] || '';
  if (/curl|wget|bot|spider/i.test(ua)) return res.status(403).send('Forbidden');
  next();
});

// ===== Rotas públicas simples =====
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'SevenxLeaks API is running',
    version: '1.0.0',
    status: 'active'
  });
});

// ===== Bloqueio de padrões suspeitos =====
app.use((req, res, next) => {
  const url = decodeURIComponent(req.originalUrl);
  const bloqueios = [
    /\.bak$/i,
    /\.old$/i,
    /nice ports/i,
    /trinity/i,
    /\.git/i,
    /\.env/i,
    /wp-admin/i,
    /phpmyadmin/i
  ];
  for (const pattern of bloqueios) {
    if (pattern.test(url)) {
      console.warn(`try suspect: ${url}`);
      return res.status(403).send('Access denied.');
    }
  }
  next();
});

// ===== Banco de dados: Pool PG =====
let pool;
if (process.env.POSTGRES_URL) {
  const baseCfg = { connectionString: process.env.POSTGRES_URL };
  const prodExtras = {
    ssl: { require: true, rejectUnauthorized: false },
    max: 5,
    min: 0,
    idle: 10_000,
    acquire: 30_000
  };
  pool = new Pool(process.env.NODE_ENV === 'production' ? { ...baseCfg, ...prodExtras } : baseCfg);

  pool.connect((err, client, done) => {
    if (err) {
      console.error('Erro ao conectar ao banco de dados:', err);
    } else {
      console.log('Conexão bem-sucedida ao banco de dados');
      done();
    }
  });
}

// ===== Sequelize: autenticar; sync só fora de produção =====
const initializeDatabase = async () => {
  try {
    await db.sequelize.authenticate();
    console.log('Conexão com o banco de dados estabelecida com sucesso.');
    if (process.env.NODE_ENV !== 'production') {
      await db.sequelize.sync({ alter: true });
    }
    return true;
  } catch (err) {
    console.error('Erro ao conectar ao banco de dados Sequelize:', err);
    return false;
  }
};

initializeDatabase().then((success) => {
  // Em ambiente local, sobe HTTP tradicional
  if (!process.env.VERCEL && success) {
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}...`));
  }
});

// ===== Tratamento de erros =====
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ===== 404 =====
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// ===== Export =====
module.exports = process.env.VERCEL ? serverless(app) : app;
