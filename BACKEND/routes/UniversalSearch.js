// /routes/UniversalSearch.js
const express = require('express');
const router = express.Router();
const { Op, Sequelize } = require('sequelize');

const {
  AsianContent,
  WesternContent,
  BannedContent,
  UnknownContent,
  VipAsianContent,
  VipWesternContent,
  VipBannedContent,
  VipUnknownContent,
} = require('../models');

/**
 * Filtro de datas baseado em postDate.
 * dateFilter: 'today' | 'yesterday' | 'last7' | 'last30' | 'thisMonth' | 'prevMonth' | undefined
 * month: 1..12 para filtrar mês específico do ano corrente
 */
function createDateFilter(dateFilter, month) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const where = {};

  if (month) {
    return {
      postDate: {
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn('EXTRACT', Sequelize.literal('MONTH FROM "postDate"')),
            month
          ),
          Sequelize.where(
            Sequelize.fn('EXTRACT', Sequelize.literal('YEAR FROM "postDate"')),
            today.getFullYear()
          ),
        ],
      },
    };
  }

  const start = new Date(today);
  const end = new Date(today);
  end.setDate(end.getDate() + 1); // exclusivo

  switch (dateFilter) {
    case 'today':
      where.postDate = { [Op.gte]: start, [Op.lt]: end };
      break;
    case 'yesterday': {
      const y0 = new Date(today);
      y0.setDate(y0.getDate() - 1);
      const y1 = new Date(today);
      where.postDate = { [Op.gte]: y0, [Op.lt]: y1 };
      break;
    }
    case 'last7': {
      const s = new Date(today);
      s.setDate(s.getDate() - 7);
      where.postDate = { [Op.gte]: s, [Op.lt]: end };
      break;
    }
    case 'last30': {
      const s = new Date(today);
      s.setDate(s.getDate() - 30);
      where.postDate = { [Op.gte]: s, [Op.lt]: end };
      break;
    }
    case 'thisMonth': {
      const s = new Date(today.getFullYear(), today.getMonth(), 1);
      const e = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      where.postDate = { [Op.gte]: s, [Op.lt]: e };
      break;
    }
    case 'prevMonth': {
      const s = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const e = new Date(today.getFullYear(), today.getMonth(), 1);
      where.postDate = { [Op.gte]: s, [Op.lt]: e };
      break;
    }
    default:
      // sem filtro de data
      break;
  }

  return where;
}

/**
 * Busca segura por modelo, SEM paginação aqui.
 * Ordena apenas para garantir estabilidade relativa antes do merge.
 */
async function safeModelSearch(model, whereClause, sortBy, sortOrder, q, categories) {
  const where = { ...whereClause };

  if (q) {
    const like = { [Op.iLike]: `%${q}%` };
    where[Op.or] = [
      { name: like },
      { slug: like },
      { category: like },
    ];
  }

  if (categories && categories.length) {
    where.category = { [Op.in]: categories };
  }

  return model.findAll({
    where,
    order: [
      [Sequelize.col(sortBy), sortOrder],
      ['createdAt', sortOrder],
      ['id', sortOrder],
    ],
    raw: true,
  });
}

/**
 * Mapa de modelos => contentType fixo na resposta.
 */
const SOURCES = [
  { model: AsianContent,         contentType: 'asian' },
  { model: WesternContent,       contentType: 'western' },
  { model: BannedContent,        contentType: 'banned' },
  { model: UnknownContent,       contentType: 'unknown' },
  { model: VipAsianContent,      contentType: 'vip-asian' },
  { model: VipWesternContent,    contentType: 'vip-western' },
  { model: VipBannedContent,     contentType: 'vip-banned' },
  { model: VipUnknownContent,    contentType: 'vip-unknown' },
];

/**
 * GET /universal-search/search
 * Query params:
 *  - page: número da página (1..n)
 *  - limit: itens por página
 *  - sortBy: default 'postDate'
 *  - sortOrder: 'DESC' | 'ASC' (default 'DESC')
 *  - dateFilter: conforme createDateFilter
 *  - month: 1..12
 *  - q: termo de busca
 *  - categories: lista CSV de categorias a filtrar (ex.: "Asian,Teen,Big Tits")
 */
router.get('/search', async (req, res) => {
  const t0 = Date.now();

  // parâmetros
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || '50', 10), 1), 500);
  const sortBy = (req.query.sortBy || 'postDate');
  const sortOrder = (String(req.query.sortOrder || 'DESC').toUpperCase() === 'ASC') ? 'ASC' : 'DESC';
  const dateFilter = req.query.dateFilter;
  const month = req.query.month ? parseInt(req.query.month, 10) : undefined;
  const q = req.query.q ? String(req.query.q).trim() : undefined;
  const categories = req.query.categories
    ? String(req.query.categories)
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
    : undefined;

  try {
    // where de datas
    const whereDate = createDateFilter(dateFilter, month);

    // coleta de todos os modelos SEM limit/offset
    const tasks = SOURCES.map(src =>
      safeModelSearch(src.model, whereDate, sortBy, sortOrder, q, categories)
        .then(rows => rows.map(r => ({ ...r, contentType: src.contentType })))
    );

    const parts = await Promise.all(tasks);
    let allResults = parts.flat();

    // ordenação estável final
    allResults.sort((a, b) => {
      const av = new Date(a.postDate || a.createdAt).getTime();
      const bv = new Date(b.postDate || b.createdAt).getTime();
      if (av !== bv) return sortOrder === 'DESC' ? (bv - av) : (av - bv);

      const ac = new Date(a.createdAt).getTime();
      const bc = new Date(b.createdAt).getTime();
      if (ac !== bc) return sortOrder === 'DESC' ? (bc - ac) : (ac - bc);

      // id numérico ou string
      const ai = typeof a.id === 'number' ? a.id : Number(a.id) || 0;
      const bi = typeof b.id === 'number' ? b.id : Number(b.id) || 0;
      return sortOrder === 'DESC' ? (bi - ai) : (ai - bi);
    });

    // paginação única
    const total = allResults.length;
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    const offset = (page - 1) * limit;
    const data = allResults.slice(offset, offset + limit);

    const dt = Date.now() - t0;
    return res.json({
      page,
      perPage: limit,
      total,
      totalPages,
      data,
      searchTime: dt,
    });
  } catch (err) {
    // resposta objetiva de erro
    return res.status(500).json({
      error: 'SEARCH_FAILED',
      message: err?.message || 'Erro interno ao processar a busca.',
    });
  }
});

module.exports = router;
