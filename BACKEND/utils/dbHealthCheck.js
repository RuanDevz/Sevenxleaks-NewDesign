const { sequelize } = require('../models');

// Função para verificar saúde da conexão
async function checkDatabaseHealth() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection is healthy');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Função para reconectar em caso de falha
async function reconnectDatabase() {
  try {
    console.log('🔄 Tentando reconectar ao banco...');
    await sequelize.close();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Aguarda 2s
    await sequelize.authenticate();
    console.log('✅ Reconexão bem-sucedida');
    return true;
  } catch (error) {
    console.error('❌ Falha na reconexão:', error.message);
    return false;
  }
}

// Middleware para verificar conexão antes de queries críticas
const ensureConnection = async (req, res, next) => {
  try {
    const isHealthy = await checkDatabaseHealth();
    if (!isHealthy) {
      const reconnected = await reconnectDatabase();
      if (!reconnected) {
        return res.status(503).json({ 
          error: 'Serviço temporariamente indisponível',
          message: 'Problemas de conectividade com o banco de dados'
        });
      }
    }
    next();
  } catch (error) {
    console.error('Erro no health check:', error.message);
    return res.status(503).json({ 
      error: 'Serviço temporariamente indisponível' 
    });
  }
};

module.exports = {
  checkDatabaseHealth,
  reconnectDatabase,
  ensureConnection
};