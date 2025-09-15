'use strict';

const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const process = require('process');

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const allConfigs = require(path.join(__dirname, '..', 'config', 'config.json'));
const cfg = allConfigs[env] || {};
const db = {};

// Fonte única do DSN
const URL = process.env.POSTGRES_URL || (cfg.use_env_variable ? process.env[cfg.use_env_variable] : null);

// Detecta necessidade de SSL
const sslFromUrl = /sslmode=require/i.test(URL || '');
const sslFlag = (process.env.PGSSL || '').toLowerCase() === 'true';
const mustSSL = sslFromUrl || sslFlag;

// Pool padrão seguro para prod/serverless moderado
const defaultPool = {
  max: Number(process.env.DB_POOL_MAX || 5),
  min: 0,
  idle: 10_000,
  acquire: 60_000,
  evict: 10_000
};

// Opções comuns
const baseOptions = {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' && process.env.SQL_LOG === 'true' ? console.log : false,
  pool: cfg.pool || defaultPool,
  dialectOptions: {
    ...(cfg.dialectOptions || {}),
    ...(mustSSL ? { ssl: { require: true, rejectUnauthorized: false } } : {})
  }
};

let sequelize;

if (URL) {
  sequelize = new Sequelize(URL, baseOptions);
} else {
  // Fallback ao config.json apenas se o DSN não existir
  sequelize = new Sequelize(
    cfg.database,
    cfg.username,
    cfg.password,
    {
      host: cfg.host,
      port: cfg.port,
      ...baseOptions
    }
  );
}

// Carrega modelos
fs.readdirSync(__dirname)
  .filter(file =>
    file.indexOf('.') !== 0 &&
    file !== basename &&
    file.endsWith('.js') &&
    !file.endsWith('.test.js')
  )
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, DataTypes);
    db[model.name] = model;
  });

// Associações
Object.keys(db).forEach(name => {
  if (typeof db[name].associate === 'function') db[name].associate(db);
});

// Exporta
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
