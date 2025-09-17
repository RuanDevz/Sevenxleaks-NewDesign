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

  // Se um mês específico foi selecionado, use apenas esse filtro
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

  // Filtros de data específicos
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
      // Sem filtro de data
      break;
  }

  return whereClause;
}

// Rota universal de busca
router.get('/search', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 24;
    const offset = (page - 1) * limit;

    const { 
      search, 
      category, 
      month, 
      dateFilter,
      contentType = 'all', // asian, western, banned, unknown, vip-asian, vip-western, vip-banned, vip-unknown
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

    // Filtro de região (para conteúdos que têm região)
    if (region) {
      searchWhere.region = region;
    }

    // Aplicar filtros de data
    const dateWhere = createDateFilter(dateFilter || 'all', month);
    const finalWhere = { ...searchWhere, ...dateWhere };

    let allResults = [];

    // Determinar quais tabelas buscar baseado no contentType
    const tablesToSearch = [];
    
    if (contentType === 'all' || contentType === 'asian') {
      tablesToSearch.push({ model: AsianContent, type: 'asian' });
    }
    if (contentType === 'all' || contentType === 'western') {
      tablesToSearch.push({ model: WesternContent, type: 'western' });
    }
    if (contentType === 'all' || contentType === 'banned') {
      tablesToSearch.push({ model: BannedContent, type: 'banned' });
    }
    if (contentType === 'all' || contentType === 'unknown') {
      tablesToSearch.push({ model: UnknownContent, type: 'unknown' });
    }
    if (contentType === 'all' || contentType === 'vip-asian') {
      tablesToSearch.push({ model: VipAsianContent, type: 'vip-asian' });
    }
    if (contentType === 'all' || contentType === 'vip-western') {
      tablesToSearch.push({ model: VipWesternContent, type: 'vip-western' });
    }
    if (contentType === 'all' || contentType === 'vip-banned') {
      tablesToSearch.push({ model: VipBannedContent, type: 'vip-banned' });
    }
    if (contentType === 'all' || contentType === 'vip-unknown') {
      tablesToSearch.push({ model: VipUnknownContent, type: 'vip-unknown' });
    }

    // Buscar em todas as tabelas relevantes com timeout e retry
    const searchPromises = tablesToSearch.map(async ({ model, type }) => {
      try {
        // Adicionar timeout específico para cada query
        const results = await Promise.race([
          model.findAll({
            where: finalWhere,
            order: [[sortBy, sortOrder]],
            raw: true,
            timeout: 30000, // 30 segundos timeout por query
            retry: {
              max: 2,
              match: [/ConnectionError/, /TimeoutError/, /ConnectionAcquireTimeoutError/]
            }
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`Query timeout for ${type}`)), 30000)
          )
        ]);
        
        return results.map(item => ({ ...item, contentType: type }));
      } catch (error) {
        console.error(`Erro ao buscar em ${type}:`, error.message);
        // Retorna array vazio em caso de erro para não quebrar a busca
        return [];
      }
    });

    // Executar todas as buscas em paralelo com timeout global
    try {
      const searchResults = await Promise.allSettled(searchPromises);
      
      searchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allResults = [...allResults, ...result.value];
        } else {
          console.error(`Busca falhou para ${tablesToSearch[index].type}:`, result.reason);
        }
      });
    } catch (error) {
      console.error('Erro geral na busca universal:', error);
    }

    // Ordenar todos os resultados por data
    allResults.sort((a, b) => {
      const dateA = new Date(a.postDate);
      const dateB = new Date(b.postDate);
      return sortOrder === 'DESC' ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
    });

    // Paginação manual
    const total = allResults.length;
    const paginatedResults = allResults.slice(offset, offset + limit);

    const payload = {
      page,
      perPage: limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: paginatedResults
    };

    const encodedPayload = encodePayloadToBase64(payload);
    return res.status(200).json({ data: encodedPayload });

  } catch (error) {
    console.error('Erro na busca universal:', error);
    // Em caso de erro crítico, retorna resposta vazia mas válida
    const emptyPayload = {
      page: parseInt(req.query.page) || 1,
      perPage: parseInt(req.query.limit) || 24,
      total: 0,
      totalPages: 0,
      data: []
    };
    const encodedPayload = encodePayloadToBase64(emptyPayload);
    res.status(200).json({ data: encodedPayload });
  }
});

module.exports = router;