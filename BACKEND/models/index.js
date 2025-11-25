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
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      },
    },
    pool: {
      max: 20,
      min: 5,
      idle: 30000,
      acquire: 60000,
      evict: 10000,
      handleDisconnects: true
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
      max: 5
    },
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
      max: 10,
      min: 2,
      idle: 30000,
      acquire: 60000,
      evict: 10000
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

// Função para criar tabelas se não existirem
const createTablesIfNotExist = async () => {
  try {
    console.log('🔄 Verificando e criando tabelas...');
    
    // Force sync apenas em produção se as tabelas não existirem
    await sequelize.sync({ force: false, alter: false });
    
    console.log('✅ Tabelas verificadas/criadas com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error.message);
    
    // Tenta criar tabelas individualmente
    try {
      console.log('🔄 Tentando criar tabelas individualmente...');
      
      const models = Object.values(db).filter(model => 
        model && typeof model.sync === 'function'
      );
      
      for (const model of models) {
        try {
          await model.sync({ force: false });
          console.log(`✅ Tabela ${model.name} criada/verificada`);
        } catch (modelError) {
          console.error(`❌ Erro ao criar tabela ${model.name}:`, modelError.message);
        }
      }
      
      return true;
    } catch (fallbackError) {
      console.error('❌ Falha total na criação de tabelas:', fallbackError.message);
      return false;
    }
  }
};

// Exportar função para uso no index.js
db.createTablesIfNotExist = createTablesIfNotExist;
module.exports = db;