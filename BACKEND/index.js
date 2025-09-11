const express = require('express');
const cors = require('cors');
const db = require('./models');
require('dotenv').config();
const { Pool } = require('pg');

const app = express();

console.log('Iniciando servidor...');

// Proxy e CORS
app.set('trust proxy', 1);
console.log('Trust proxy ativado');

app.use(cors({
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
}));
console.log('Middleware CORS configurado');

// Bloqueio de domínios
app.use((req, res, next) => {
  const referer = req.headers.referer || '';
  const origin = req.headers.origin || '';
  console.log('Verificando origem:', { referer, origin });

  const blockedDomains = ['https://bypass.city/'];

  if (blockedDomains.some(domain => referer.includes(domain) || origin.includes(domain))) {
    console.warn('Bloqueio acionado para origem:', origin || referer);
    return res.status(403).json({ message: 'You are blocked' });
  }

  next();
});

// Rotas principais
console.log('Registrando rotas...');
const webhookRouter = require('./routes/stripewebhook');
app.use('/webhook', webhookRouter);

app.use((req, res, next) => {
  if (req.originalUrl === '/webhook') {
    console.log('Passando pelo /webhook sem JSON body parser');
    next();
  } else {
    express.json()(req, res, next);
  }
});

// Roteadores
try {
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
  const stripeWebhookRouter = require('./routes/stripewebhook');
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

  console.log('Rotas carregadas com sucesso');
  
  // Aqui entra cada app.use() com console.log
  app.use('/auth', userRouter);
  console.log('Rota /auth registrada');

  app.use('/cancel-subscription', cancelsubscriptionRouter);
  console.log('Rota /cancel-subscription registrada');

  app.use('/reactions', reactionsRouter);
  console.log('Rota /reactions registrada');

  // ... repita para cada rota importante
} catch (err) {
  console.error('Erro ao carregar rotas:', err);
}

// Rate limit
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, 
  message: 'Ip bloqueado.',
});
app.use(limiter);
console.log('Rate limiter ativado');

// Proteção user-agent
app.use((req, res, next) => {
  const ua = req.headers['user-agent'] || '';
  console.log('User-Agent:', ua);
  if (/curl|wget|bot|spider/i.test(ua)) {
    console.warn('User-Agent bloqueado:', ua);
    return res.status(403).send('Forbidden');
  }
  next();
});

// Proteção URLs
app.use((req, res, next) => {
  const url = decodeURIComponent(req.originalUrl);
  console.log('Acessando URL:', url);

  const bloqueios = [/\.bak$/i, /\.old$/i, /nice ports/i, /trinity/i, /\.git/i, /\.env/i, /wp-admin/i, /phpmyadmin/i];

  for (const pattern of bloqueios) {
    if (pattern.test(url)) {
      console.warn('Bloqueio por padrão:', pattern, 'na URL:', url);
      return res.status(403).send('Access denied.');
    }
  }
  next();
});

// Banco
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL, 
});

pool.connect((err, client, done) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados (Pool):', err);
    return;
  }
  console.log('Conexão bem-sucedida ao banco de dados (Pool)');
  console.log('DB URL:', process.env.POSTGRES_URL);
  done();
});

db.sequelize.sync({ alter: true });

db.sequelize.authenticate()
  .then(() => {
    console.log('Conexão com Sequelize estabelecida com sucesso.');
    return db.sequelize.sync();
  })
  .then(() => {
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}...`);
    });
  })
  .catch(err => {
    console.error('Erro Sequelize:', err);
  });
