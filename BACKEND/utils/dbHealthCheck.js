const { sequelize } = require('../models');

let isConnected = true;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

async function checkDatabaseHealth() {
  try {
    await sequelize.query('SELECT 1', { timeout: 5000 });
    if (!isConnected) {
      console.log('✅ Database connection restored');
      isConnected = true;
      reconnectAttempts = 0;
    }
    return true;
  } catch (error) {
    isConnected = false;
    console.error('❌ Database health check failed:', error.message);
    return false;
  }
}

async function reconnectDatabase() {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error('❌ Máximo de tentativas de reconexão atingido');
    reconnectAttempts = 0;
    return false;
  }

  reconnectAttempts++;

  try {
    console.log(`🔄 Tentativa de reconexão ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}...`);
    await new Promise(resolve => setTimeout(resolve, 2000 * reconnectAttempts));
    await sequelize.authenticate();
    console.log('✅ Reconexão bem-sucedida');
    isConnected = true;
    reconnectAttempts = 0;
    return true;
  } catch (error) {
    console.error(`❌ Falha na reconexão (tentativa ${reconnectAttempts}):`, error.message);
    return false;
  }
}

const ensureConnection = async (req, res, next) => {
  if (isConnected) {
    return next();
  }

  try {
    const isHealthy = await checkDatabaseHealth();
    if (isHealthy) {
      return next();
    }

    const reconnected = await reconnectDatabase();
    if (reconnected) {
      return next();
    }

    return res.status(503).json({
      error: 'Serviço temporariamente indisponível',
      message: 'Problemas de conectividade com o banco de dados'
    });
  } catch (error) {
    console.error('Erro no health check:', error.message);
    return res.status(503).json({
      error: 'Serviço temporariamente indisponível'
    });
  }
};

setInterval(async () => {
  if (!isConnected) {
    await checkDatabaseHealth();
  }
}, 30000);

module.exports = {
  checkDatabaseHealth,
  reconnectDatabase,
  ensureConnection
};
