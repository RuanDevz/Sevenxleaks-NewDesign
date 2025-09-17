const express = require('express');
const router = express.Router();
const { AsianContent, WesternContent, BannedContent, UnknownContent, VipAsianContent, VipWesternContent, VipBannedContent, VipUnknownContent } = require('../models');
const { Op, Sequelize } = require('sequelize');

function insertRandomChar(base64Str) {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const randomChar = letters.charAt(Math.floor(Math.random() * letters.length));
  return base64Str.slice(0, 2) + randomChar + base64Str.slice(2);
}

function encodePayloadToBase64(payload) {
  const jsonStr = JSON.stringify(payload);
  const base64Str = Buffer.from(jsonStr).toString('base64');
  return insertRandomChar(base64Str);
}

// Função para criar filtros de data baseados no postDate
function createDateFilter(dateFilter, month) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let whereClause = {};

  if (month) {
    whereClause.postDate = {
      [Op.and]: [
        Sequelize.where(
          Sequelize.fn('EXTRACT', Sequelize.literal('MONTH FROM "postDate"')),
          month
        ),
        Sequelize.where(
          Sequelize.fn('EXTRACT', Sequelize.literal('YEAR FROM "postDate"')),
          today.getFullYear()
        )
      ]
    };
    return whereClause;
  }

  switch (dateFilter) {
    case 'today':
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);
      whereClause.postDate = {
        [Op.between]: [today, todayEnd]
      };
      break;
      
    case 'yesterday':
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yesterdayEnd = new Date(yesterday);
      yesterdayEnd.setHours(23, 59, 59, 999);
      whereClause.postDate = {
        [Op.between]: [yesterday, yesterdayEnd]
      };
      break;
      
    case '7days':
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);
      whereClause.postDate = {
        [Op.gte]: sevenDaysAgo
      };
      break;
      
    case 'all':
    default:
      break;
  }

  return whereClause;
}

// Função para buscar com timeout e fallback
async function safeModelSearch(model, modelName, whereClause, sortBy, sortOrder, limit, offset) {  
  try {
    console.log(`Iniciando busca em ${modelName}...`);
    
    const result = await model.findAll({
      where: whereClause,
      order: [[sortBy, sortOrder]],
      limit,
      offset,
      raw: true
    });
    
    console.log(`Busca em ${modelName} concluída: ${result.length} itens`);
    return result;
    
  } catch (error) {
    console.error(`Erro ao buscar em ${modelName}:`, error.message);
    return [];
  }
}

// Rota universal de busca com implementação mais robusta
router.get('/search', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 300;
    const offset = (page - 1) * limit;

    const { 
      search, 
      category, 
      month, 
      dateFilter,
      contentType = 'all',
      region,
      sortBy = 'postDate', 
      sortOrder = 'DESC' 
    } = req.query;

    let searchWhere = {};
    
    // Filtro de busca por nome
    if (search) {
      searchWhere.name = { [Op.iLike]: `%${search}%` };
    }

    // Filtro de categoria
    if (category) {
      searchWhere.category = category;
    }

    // Filtro de região
    if (region) {
      searchWhere.region = region;
    }

    // Aplicar filtros de data
    const dateWhere = createDateFilter(dateFilter || 'all', month);
    const finalWhere = { ...searchWhere, ...dateWhere };

    console.log('Iniciando busca universal com filtros:', finalWhere);

    // Determinar quais tabelas buscar
    const searchTasks = [];
    
    if (contentType === 'all' || contentType === 'asian') {
      searchTasks.push({
        name: 'asian',
        task: () => safeModelSearch(AsianContent, 'AsianContent', finalWhere, sortBy, sortOrder, limit, offset)
      });
    }
    if (contentType === 'all' || contentType === 'western') {
      searchTasks.push({
        name: 'western',
        task: () => safeModelSearch(WesternContent, 'WesternContent', finalWhere, sortBy, sortOrder, limit, offset)
      });
    }
    if (contentType === 'all' || contentType === 'banned') {
      searchTasks.push({
        name: 'banned',
        task: () => safeModelSearch(BannedContent, 'BannedContent', finalWhere, sortBy, sortOrder, limit, offset)
      });
    }
    if (contentType === 'all' || contentType === 'unknown') {
      searchTasks.push({
        name: 'unknown',
        task: () => safeModelSearch(UnknownContent, 'UnknownContent', finalWhere, sortBy, sortOrder, limit, offset)
      });
    }
    if (contentType === 'all' || contentType === 'vip-asian') {
      searchTasks.push({
        name: 'vip-asian',
        task: () => safeModelSearch(VipAsianContent, 'VipAsianContent', finalWhere, sortBy, sortOrder, limit, offset)
      });
    }
    if (contentType === 'all' || contentType === 'vip-western') {
      searchTasks.push({
        name: 'vip-western',
        task: () => safeModelSearch(VipWesternContent, 'VipWesternContent', finalWhere, sortBy, sortOrder, limit, offset)
      });
    }
    if (contentType === 'all' || contentType === 'vip-banned') {
      searchTasks.push({
        name: 'vip-banned',
        task: () => safeModelSearch(VipBannedContent, 'VipBannedContent', finalWhere, sortBy, sortOrder, limit, offset)
      });
    }
    if (contentType === 'all' || contentType === 'vip-unknown') {
      searchTasks.push({
        name: 'vip-unknown',
        task: () => safeModelSearch(VipUnknownContent, 'VipUnknownContent', finalWhere, sortBy, sortOrder, limit, offset)
      });
    }

    // Executar buscas
    let allResults = [];
    
    try {
      const searchPromises = searchTasks.map(({ name, task }) => 
        task().then(results => ({ name, results: results.map(item => ({ ...item, contentType: name })) }))
      );

      const searchResults = await Promise.allSettled(searchPromises);

      // Processar resultados
      searchResults.forEach((result) => {
        if (result.status === 'fulfilled' && result.value.results) {
          allResults = [...allResults, ...result.value.results];
        } else if (result.status === 'rejected') {
          console.error(`Busca falhou:`, result.reason?.message || 'Erro desconhecido');
        }
      });

    } catch (error) {
      console.error('Erro nas buscas:', error.message);
    }

    // Ordenar resultados
    allResults.sort((a, b) => {
      const dateA = new Date(a.postDate || a.createdAt || Date.now());
      const dateB = new Date(b.postDate || b.createdAt || Date.now());
      return sortOrder === 'DESC' ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
    });

    // Paginação
    const total = allResults.length;
    const paginatedResults = allResults.slice(offset, offset + limit);

    const payload = {
      page,
      perPage: limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: paginatedResults,
      searchTime: Date.now() - startTime
    };

    console.log(`Busca concluída em ${Date.now() - startTime}ms. Retornando ${paginatedResults.length} de ${total} itens.`);

    const encodedPayload = encodePayloadToBase64(payload);
    return res.status(200).json({ data: encodedPayload });

  } catch (error) {
    console.error('Erro crítico na busca universal:', error);
    
    // Resposta de emergência
    const emergencyPayload = {
      page: parseInt(req.query.page) || 1,
      perPage: Math.min(parseInt(req.query.limit) || 150, 150),
      total: 0,
      totalPages: 0,
      data: [],
      error: 'Serviço temporariamente indisponível',
      searchTime: Date.now() - startTime
    };
    
    const encodedPayload = encodePayloadToBase64(emergencyPayload);
    res.status(200).json({ data: encodedPayload });
  }
});

module.exports = router;