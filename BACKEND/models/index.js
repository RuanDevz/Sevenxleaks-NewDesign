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
    // mescla opções do config.json se existirem
    ...(cfg.dialectOptions ? { dialectOptions: cfg.dialectOptions } : {}),
    ...(cfg.pool ? { pool: cfg.pool } : {}),
    // Configurações específicas para Vercel
    ...(process.env.VERCEL ? {
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      pool: {
        max: 5,
        min: 0,
        idle: 10000,
        acquire: 30000,
        evict: 1000
      }
    } : {})
  });
} else {
  sequelize = new Sequelize(cfg.database, cfg.username, cfg.password, {
    host: cfg.host,
    port: cfg.port,
    dialect: cfg.dialect || 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    ...(cfg.dialectOptions ? { dialectOptions: cfg.dialectOptions } : {}),
    ...(cfg.pool ? { pool: cfg.pool } : {}),
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