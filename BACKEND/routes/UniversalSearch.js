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
    default:
      break;
  }

  return where;
}

async function optimizedModelSearch(model, whereClause, sortBy, sortOrder, q, categories, limit, offset) {
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

  try {
    const [rows, count] = await Promise.all([
      model.findAll({
        where,
        order: [
          [Sequelize.col(sortBy), sortOrder],
          ['createdAt', sortOrder],
          ['id', sortOrder],
        ],
        limit,
        offset,
        raw: true,
        attributes: [
          'id',
          'name',
          'slug',
          'category',
          'postDate',
          'createdAt',
          'updatedAt',
        ],
        logging: false,
      }),
      model.count({ where, logging: false })
    ]);

    return { rows, count };
  } catch (err) {
    console.error(`[optimizedModelSearch] Error for ${model.name}:`, err.message);
    return { rows: [], count: 0 };
  }
}

async function getApproximateCount(model, whereClause, q, categories) {
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

  try {
    return await model.count({ where, logging: false });
  } catch (err) {
    console.error(`[getApproximateCount] Error for ${model.name}:`, err.message);
    return 0;
  }
}

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

router.get('/search', async (req, res) => {
  const t0 = Date.now();

  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || '50', 10), 1), 100);
  const sortBy = (req.query.sortBy || 'postDate');
  const sortOrder = (String(req.query.sortOrder || 'DESC').toUpperCase() === 'ASC') ? 'ASC' : 'DESC';

  const q = (req.query.q ?? req.query.search)?.toString().trim() || undefined;

  const categories = req.query.categories
    ? String(req.query.categories).split(',').map(s => s.trim()).filter(Boolean)
    : (req.query.category ? [String(req.query.category).trim()] : undefined);

  const dateFilter = req.query.dateFilter;
  const month = req.query.month ? parseInt(req.query.month, 10) : undefined;
  const region = req.query.region ? String(req.query.region).trim() : undefined;

  const contentType = (req.query.contentType || 'all').toString();

  const wantRaw = String(req.query.raw || '0') === '1';
  const wantDebug = String(req.query.debug || '0') === '1';

  try {
    const { sequelize } = require('../models');

    try {
      await sequelize.authenticate();
    } catch (dbErr) {
      console.error('[UniversalSearch] Database connection failed:', dbErr.message);
      const emergencyPayload = {
        page,
        perPage: limit,
        total: 0,
        totalPages: 0,
        data: [],
        error: 'DB_CONNECTION_FAILED',
        message: 'Database temporarily unavailable',
        searchTime: Date.now() - t0,
      };
      const encodedPayload = encodePayloadToBase64(emergencyPayload);
      return res.status(200).json({ data: encodedPayload });
    }

    const whereDate = createDateFilter(dateFilter, month);

    const selectedSources = SOURCES.filter(src => {
      if (contentType === 'all') return true;
      return src.key === contentType || src.contentType === contentType;
    });

    console.info(`[UniversalSearch] selectedSources: ${selectedSources.map(s => s.key).join(', ')}`);

    const offset = (page - 1) * limit;
    const perSourceLimit = Math.ceil(limit / selectedSources.length) + 10;

    const results = await Promise.all(
      selectedSources.map(async (src) => {
        try {
          const { rows, count } = await optimizedModelSearch(
            src.model,
            whereDate,
            sortBy,
            sortOrder,
            q,
            categories,
            perSourceLimit,
            0
          );

          return {
            rows: rows.map(r => ({ ...r, contentType: src.contentType })),
            count,
            source: src.key
          };
        } catch (err) {
          console.error(`[UniversalSearch] Error querying ${src.key}:`, err.message);
          return { rows: [], count: 0, source: src.key };
        }
      })
    );

    let allResults = results.flatMap(r => r.rows);

    allResults.sort((a, b) => {
      const ap = new Date(a.postDate || a.createdAt).getTime();
      const bp = new Date(b.postDate || b.createdAt).getTime();
      if (ap !== bp) return sortOrder === 'DESC' ? (bp - ap) : (ap - bp);

      const ac = new Date(a.createdAt).getTime();
      const bc = new Date(b.createdAt).getTime();
      if (ac !== bc) return sortOrder === 'DESC' ? (bc - ac) : (ac - bc);

      const ai = typeof a.id === 'number' ? a.id : Number(a.id) || 0;
      const bi = typeof b.id === 'number' ? b.id : Number(b.id) || 0;
      return sortOrder === 'DESC' ? (bi - ai) : (ai - bi);
    });

    const approximateTotal = results.reduce((sum, r) => sum + r.count, 0);
    const data = allResults.slice(offset, offset + limit);

    const payload = {
      page,
      perPage: limit,
      total: approximateTotal,
      totalPages: Math.max(Math.ceil(approximateTotal / limit), 1),
      data,
      searchTime: Date.now() - t0,
      sources: results.map(r => ({ source: r.source, count: r.count }))
    };

    if (wantDebug) {
      return res.status(200).json({ debug: true, payload });
    }

    if (wantRaw) {
      return res.status(200).json({ data: payload });
    }

    const encodedPayload = encodePayloadToBase64(payload);
    return res.status(200).json({ data: encodedPayload });
  } catch (err) {
    console.error('[UniversalSearch] Fatal error:', err?.stack || err);

    const emergencyPayload = {
      page,
      perPage: limit,
      total: 0,
      totalPages: 0,
      data: [],
      error: 'SEARCH_FAILED',
      message: err?.message || 'Erro interno ao processar a busca.',
      searchTime: Date.now() - t0,
    };
    const encodedPayload = encodePayloadToBase64(emergencyPayload);
    return res.status(200).json({ data: encodedPayload });
  }
});

module.exports = router;
