'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const allConfigs = require(__dirname + '/../config/config.json');
const cfg = allConfigs[env] || {};
const db = {};

let sequelize;

// prioriza POSTGRES_URL; se ausente, usa config.json
const url = process.env.POSTGRES_URL || (cfg.use_env_variable ? process.env[cfg.use_env_variable] : null);

if (url) {
  sequelize = new Sequelize(url, {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      },
      // Configurações de timeout para conexão
      connectTimeout: 60000,
      socketTimeout: 60000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 0,
    },
    pool: {
      max: 3, // Reduzido para evitar sobrecarga
      min: 0,
      idle: 5000, // Reduzido
      acquire: 60000, // Aumentado para 60 segundos
      evict: 1000,
      handleDisconnects: true,
      validate: (client) => {
        return !client.connection._ending;
      }
    },
    retry: {
      match: [
        /ConnectionError/,
        /ConnectionRefusedError/,
        /ConnectionTimedOutError/,
        /TimeoutError/,
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/,
        /ConnectionAcquireTimeoutError/
      ],
      max: 3
    },
    // Configurações adicionais para produção
    define: {
      freezeTableName: true,
      timestamps: true,
      underscored: false
    }
  });
} else {
  sequelize = new Sequelize(cfg.database, cfg.username, cfg.password, {
    host: cfg.host,
    port: cfg.port,
    dialect: cfg.dialect || 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: cfg.dialectOptions || {},
    pool: cfg.pool || {
      max: 3,
      min: 0,
      idle: 5000,
      acquire: 60000,
      evict: 1000
    }
  });
}

fs
  .readdirSync(__dirname)
  .filter(file => file.indexOf('.') !== 0 && file !== basename && file.endsWith('.js') && !file.endsWith('.test.js'))
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) db[modelName].associate(db);
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;