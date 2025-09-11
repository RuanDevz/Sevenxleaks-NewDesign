const express = require('express');
const cors = require('cors');
const db = require('./models');
require('dotenv').config();
const { Pool } = require('pg');

const app = express();

app.set('trust proxy', 1);

app.use(cors({
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
}));

app.use((req, res, next) => {
  const referer = req.headers.referer || '';
  const origin = req.headers.origin || '';

  const blockedDomains = ['https://bypass.city/'];

  if (blockedDomains.some(domain => referer.includes(domain) || origin.includes(domain))) {
    return res.status(403).json({ message: 'You are blocked' });
  }

  next();
});

//
const webhookRouter = require('./routes/stripewebhook');
app.use('/webhook', webhookRouter)


app.use((req, res, next) => {
  if (req.originalUrl === '/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

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
const cancelsubscriptionRouter = require('./routes/Cancelsubscription')
const filterOptionsRoutes = require('./routes/FilterOptions');
const stripeCustomerPortalRouter = require('./routes/stripeCustomerPortal');
const bannedContentRouter = require('./routes/BannedContent');
const unknownContentRouter = require('./routes/UnknownContent');
const rateLimit = require('express-rate-limit');
const checkApiKey = require('./Middleware/CheckapiKey');
const WesternRouter = require('./routes/WesternContent')
const VipAsianRouter = require('./routes/VipAsianContent');
const VipWesternRouter = require('./routes/VipWesternContent');
const VipBannedRouter = require('./routes/VipBannedContent');
const VipUnknownRouter = require('./routes/VipUnknownContent');
const universalSearchRouter = require('./routes/UniversalSearch');



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
app.use('/webhook', stripeWebhookRouter);
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

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: 'Ip bloqueado.',
});

app.use(limiter); 


app.use((req, res, next) => {
  const ua = req.headers['user-agent'] || '';
  if (/curl|wget|bot|spider/i.test(ua)) {
    return res.status(403).send('Forbidden');
  }
  next();
});

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



const pool = new Pool({
  connectionString: process.env.POSTGRES_URL, 
});

pool.connect((err, client, done) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
    return;
  }
  console.log('Conexão bem-sucedida ao banco de dados');
  console.log('DB URL:', process.env.POSTGRES_URL);
  done();
});

db.sequelize.sync({ alter: true });

db.sequelize.authenticate()
  .then(() => {
    console.log('Conexão com o banco de dados estabelecida com sucesso.');
    return db.sequelize.sync();
  })
  .then(() => {
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}...`);
    });
  })
  .catch(err => {
    console.error('Erro ao conectar ao banco de dados Sequelize:', err);
  });
