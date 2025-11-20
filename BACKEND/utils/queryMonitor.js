const { sequelize } = require('../models');

const SLOW_QUERY_THRESHOLD = 3000;

function setupQueryMonitoring() {
  sequelize.addHook('beforeQuery', (options) => {
    options.startTime = Date.now();
  });

  sequelize.addHook('afterQuery', (options) => {
    const duration = Date.now() - options.startTime;

    if (duration > SLOW_QUERY_THRESHOLD) {
      console.warn(`⚠️ Slow query detected (${duration}ms):`, {
        sql: options.sql?.substring(0, 200),
        duration: `${duration}ms`
      });
    }
  });

  console.log('✅ Query monitoring configurado');
}

module.exports = { setupQueryMonitoring };
