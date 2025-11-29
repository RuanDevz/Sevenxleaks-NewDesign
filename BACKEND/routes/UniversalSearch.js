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

/** =========================
 *  Utilidades
 *  ========================= */
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

/** ==========================================
 *  Filtro de datas baseado em postDate
 *  ========================================== */
function createDateFilter(dateFilter, month) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const alias = {
    '7days': 'last7',
    all: undefined,
  };
  const df = alias[dateFilter] ?? dateFilter;

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

  const where = {};
  const start = new Date(today);
  const end = new Date(today);
  end.setDate(end.getDate() + 1);

  switch (df) {
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
  }

  return where;
}

/** ===================================
 *  Busca por modelo — otimizada
 *  =================================== */
async function safeModelSearch(model, whereClause, sortBy, sortOrder, q, categories, region) {
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

  const normalAttributes = ['id', 'name', 'slug', 'category', 'preview', 'postDate', 'createdAt'];
  const vipAttributes = ['id', 'name', 'slug', 'category', 'postDate', 'createdAt'];

  const isVIP = [
    'VipAsianContent', 'VipWesternContent',
    'VipBannedContent', 'VipUnknownContent'
  ].includes(model.name);

  const cols = isVIP ? vipAttributes : normalAttributes;

  return model.findAll({
    where,
    order: [
      [Sequelize.col(sortBy), sortOrder],
      ['createdAt', sortOrder],
      ['id', sortOrder],
    ],
    attributes: cols,
    limit: 300,
    raw: true,
  }).catch(err => {
    console.error(`[safeModelSearch] Query error for model ${model.name}:`, err.message);
    return [];
  });
}

/** ============================
 *  Fontes disponíveis
 *  ============================ */
const SOURCES = [
  { key: 'asian',       model: AsianContent,      contentType: 'asian' },
  { key: 'western',     model: WesternContent,    contentType: 'western' },
  { key: 'banned',      model: BannedContent,     contentType: 'banned' },
  { key: 'unknown',     model: UnknownContent,    contentType: 'unknown' },
  { key: 'vip-asian',   model: VipAsianContent,   contentType: 'vip-asian' },
  { key: 'vip-western', model: VipWesternContent, contentType: 'vip-western' },
  { key: 'vip-banned',  model: VipBannedContent,  contentType: 'vip-banned' },
  { key: 'vip-unknown', model: VipUnknownContent, contentType: 'vip-unknown' },
];

/** ===========================
 *  Rota GET /search
 *  =========================== */
router.get('/search', async (req, res) => {
  const t0 = Date.now();

  const page = Math.max(parseInt(req.query.page || '1'), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || '300'), 1), 500);
  const sortBy = req.query.sortBy || 'postDate';
  const sortOrder = (String(req.query.sortOrder || 'DESC').toUpperCase() === 'ASC') ? 'ASC' : 'DESC';

  const q = (req.query.q ?? req.query.search)?.toString().trim() || undefined;
  const categories = req.query.categories
    ? req.query.categories.split(',').map(s => s.trim()).filter(Boolean)
    : (req.query.category ? [req.query.category.trim()] : undefined);

  const dateFilter = req.query.dateFilter;
  const month = req.query.month ? parseInt(req.query.month) : undefined;
  const region = req.query.region ? String(req.query.region).trim() : undefined;

  const contentType = (req.query.contentType || 'all').toString();

  const wantRaw = req.query.raw === '1';
  const wantDebug = req.query.debug === '1';

  try {
    const whereDate = createDateFilter(dateFilter, month);

    const selectedSources = SOURCES.filter(src => {
      if (contentType === 'all') return true;
      return src.key === contentType || src.contentType === contentType;
    });

    // 🔥 evita saturar a pool do Supabase — executa até 3 buscas por vez
    const concurrencyLimit = 3;
    let index = 0;
    const results = [];

    while (index < selectedSources.length) {
      const slice = selectedSources.slice(index, index + concurrencyLimit);

      const part = await Promise.all(
        slice.map(async (src) => {
          const rows = await safeModelSearch(src.model, whereDate, sortBy, sortOrder, q, categories, region);
          return rows.map(r => ({ ...r, contentType: src.contentType }));
        })
      );

      results.push(...part.flat());
      index += concurrencyLimit;
    }

    let allResults = results;

    // Ordenação global
    allResults.sort((a, b) => {
      const ap = new Date(a.postDate || a.createdAt).getTime();
      const bp = new Date(b.postDate || b.createdAt).getTime();
      if (ap !== bp) return sortOrder === 'DESC' ? (bp - ap) : (ap - bp);

      const ac = new Date(a.createdAt).getTime();
      const bc = new Date(b.createdAt).getTime();
      if (ac !== bc) return sortOrder === 'DESC' ? (bc - ac) : (ac - bc);

      return sortOrder === 'DESC'
        ? (Number(b.id) - Number(a.id))
        : (Number(a.id) - Number(b.id));
    });

    const total = allResults.length;
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    const offset = (page - 1) * limit;
    const data = allResults.slice(offset, offset + limit);

    const payload = {
      page,
      perPage: limit,
      total,
      totalPages,
      data,
      searchTime: Date.now() - t0,
    };

    if (wantDebug) return res.status(200).json({ debug: true, payload });
    if (wantRaw) return res.status(200).json({ data: payload });

    return res.status(200).json({ data: encodePayloadToBase64(payload) });

  } catch (err) {
    console.error('[UniversalSearch] fatal error:', err.message);

    const emergency = {
      page,
      perPage: limit,
      total: 0,
      totalPages: 0,
      data: [],
      error: 'SEARCH_FAILED',
      message: err.message,
      searchTime: Date.now() - t0,
    };

    return res.status(200).json({ data: encodePayloadToBase64(emergency) });
  }
});

module.exports = router;
