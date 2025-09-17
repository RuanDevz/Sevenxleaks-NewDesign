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

// Prioriza POSTGRES_URL; se ausente, usa config.json
const url = process.env.POSTGRES_URL || (cfg.use_env_variable ? process.env[cfg.use_env_variable] : null);

if (url) {
  sequelize = new Sequelize(url, {
    dialect: 'postgres',
    logging: false, // Desabilita logs para reduzir overhead
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      },
      // Configurações agressivas de timeout
      connectTimeout: 20000,
      socketTimeout: 20000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 0,
      statement_timeout: 15000, // 15 segundos para statements
      query_timeout: 15000,
      idle_in_transaction_session_timeout: 10000
    },
    pool: {
      max: 1, // Apenas 1 conexão para evitar concorrência
      min: 0,
      idle: 3000, // Reduzido drasticamente
      acquire: 15000, // Reduzido para 15 segundos
      evict: 1000,
      handleDisconnects: true,
      validate: (client) => {
        return client && !client.connection._ending && !client.connection.destroyed;
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
      max: 2 // Reduzido para 2 tentativas
    },
    // Configurações para reduzir overhead
    define: {
      freezeTableName: true,
      timestamps: true,
      underscored: false
    },
    // Configurações específicas para serverless
    hooks: {
      beforeConnect: async (config) => {
        console.log('Tentando conectar ao banco...');
      },
      afterConnect: async (connection, config) => {
        console.log('Conexão estabelecida com sucesso');
      }
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
      max: 1,
      min: 0,
      idle: 3000,
      acquire: 15000,
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