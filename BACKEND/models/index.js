'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const allConfigs = require(__dirname + '/../config/config.json');
const cfg = allConfigs[env] || {};
const db = {};

// 🔥 Usa conexão global para evitar abrir 100 conexões no Supabase
let sequelize = global.sequelize;

if (!sequelize) {
  const url = process.env.POSTGRES_URL || (cfg.use_env_variable ? process.env[cfg.use_env_variable] : null);

  sequelize = global.sequelize = url
    ? new Sequelize(url, {
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
          ssl: { require: true, rejectUnauthorized: false }
        },
        pool: {
          max: 5,
          min: 0,
          idle: 10000,
          acquire: 20000
        }
      })
    : new Sequelize(cfg.database, cfg.username, cfg.password, {
        host: cfg.host,
        port: cfg.port,
        dialect: cfg.dialect || 'postgres',
        logging: env === 'development' ? console.log : false,
        dialectOptions: cfg.dialectOptions || {},
        pool: {
          max: 5,
          min: 0,
          idle: 10000,
          acquire: 20000
        }
      });
}

// Carrega models
fs.readdirSync(__dirname)
  .filter(file => file.indexOf('.') !== 0 && file !== basename && file.endsWith('.js'))
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// Associações
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) db[modelName].associate(db);
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
