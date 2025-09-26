// routes/asian.js
const express = require('express');
const router = express.Router();
const { AsianContent } = require('../models');
const verifyToken = require('../Middleware/verifyToken');
const isAdmin = require('../Middleware/isAdmin');
const { Op, Sequelize } = require('sequelize');

// ===== util de ofuscação =====
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

// ===== slug =====
function normalizeName(name) {
  return String(name)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
function baseSlug(postDate, name) {
  const d = new Date(postDate);
  if (Number.isNaN(d.getTime())) throw new Error('postDate inválido para slug');
  const formattedDate = d.toISOString().split('T')[0];
  const baseName = normalizeName(name);
  if (!baseName) throw new Error('name inválido para slug');
  return `${formattedDate}-${baseName}`;
}
async function ensureUniqueSlug(model, desiredSlug, ignoreId = null) {
  let slug = desiredSlug;
  let counter = 1;
  while (true) {
    const where = { slug };
    if (ignoreId) where.id = { [Op.ne]: ignoreId };
    const exists = await model.findOne({ where, attributes: ['id'] });
    if (!exists) return slug;
    slug = `${desiredSlug}-${counter}`;
    counter++;
    if (counter > 9999) throw new Error('Falha ao gerar slug único');
  }
}
async function generateSlugFor(model, postDate, name, ignoreId = null) {
  const desired = baseSlug(postDate, name);
  return ensureUniqueSlug(model, desired, ignoreId);
}
const SLUG_REGEX = /^\d{4}-\d{2}-\d{2}-(?:[a-z0-9-]+)(?:-\d+)?$/;

// ===== POST - Create =====
router.post('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const body = req.body;
    if (Array.isArray(body)) {
      const prepared = [];
      for (const item of body) {
        const clone = { ...item };
        if (!clone.slug) clone.slug = await generateSlugFor(AsianContent, clone.postDate, clone.name);
        prepared.push(clone);
      }
      const created = await AsianContent.bulkCreate(prepared, { individualHooks: true });
      return res.status(201).json(created);
    } else {
      const data = { ...body };
      if (!data.slug) data.slug = await generateSlugFor(AsianContent, data.postDate, data.name);
      const created = await AsianContent.create(data);
      return res.status(201).json(created);
    }
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao criar conteúdo asiático: ' + error.message });
  }
});

// ===== GET /asian/search (paginado no DB, sem region) =====
router.get('/search', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 300;
    const offset = (page - 1) * limit;

    const {
      search,
      category,
      month,
      sortBy = 'postDate',
      sortOrder = 'DESC',
      dateFilter, // 'today' | 'yesterday' | '7days' | 'all'
    } = req.query;

    const where = {};

    if (search) where.name = { [Op.iLike]: `%${search}%` };
    if (category) where.category = category;

    if (month) {
      where.postDate = {
        ...(where.postDate || {}),
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn('EXTRACT', Sequelize.literal('MONTH FROM "postDate"')),
            month
          ),
        ],
      };
    }

    if (dateFilter && dateFilter !== 'all') {
      const now = new Date();
      const start = new Date(now);
      const end = new Date(now);
      const setUTCStart = (d) => d.setUTCHours(0, 0, 0, 0);
      const setUTCEnd = (d) => d.setUTCHours(23, 59, 59, 999);

      if (dateFilter === 'today') {
        setUTCStart(start); setUTCEnd(end);
      } else if (dateFilter === 'yesterday') {
        start.setUTCDate(start.getUTCDate() - 1);
        end.setUTCDate(end.getUTCDate() - 1);
        setUTCStart(start); setUTCEnd(end);
      } else if (dateFilter === '7days') {
        start.setUTCDate(start.getUTCDate() - 6);
        setUTCStart(start); setUTCEnd(end);
      }

      where.postDate = {
        ...(where.postDate || {}),
        [Op.gte]: start,
        [Op.lte]: end,
      };
    }

    const { rows, count } = await AsianContent.findAndCountAll({
      where,
      order: [[sortBy, sortOrder]],
      limit,
      offset,
      raw: true,
    });

    const payload = {
      page,
      perPage: limit,
      total: count,
      totalPages: Math.ceil(count / limit),
      data: rows.map((r) => ({ ...r, contentType: 'asian' })),
    };

    const encodedPayload = encodePayloadToBase64(payload);
    return res.status(200).json({ data: encodedPayload });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar conteúdos: ' + error.message });
  }
});

// ===== GET /asian (lista paginada simples) =====
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 300;
    const offset = (page - 1) * limit;

    const { category, month } = req.query;

    const where = {};
    if (category) where.category = category;
    if (month) {
      where.postDate = {
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn('EXTRACT', Sequelize.literal('MONTH FROM "postDate"')),
            month
          ),
        ],
      };
    }

    const { rows, count } = await AsianContent.findAndCountAll({
      where,
      limit,
      offset,
      order: [['postDate', 'DESC']],
      raw: true,
    });

    const payload = {
      page,
      perPage: limit,
      total: count,
      totalPages: Math.ceil(count / limit),
      data: rows.map((r) => ({ ...r, contentType: 'asian' })),
    };
    const encodedPayload = encodePayloadToBase64(payload);
    res.status(200).json({ data: encodedPayload });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar conteúdos asiáticos: ' + error.message });
  }
});

// ===== GET by slug =====
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const asianContent = await AsianContent.findOne({ where: { slug } });
    if (!asianContent) {
      return res.status(404).json({ error: 'Conteúdo asiático não encontrado com esse slug' });
    }
    const encodedContent = encodePayloadToBase64(asianContent);
    res.status(200).json({ data: encodedContent });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar conteúdo asiático por slug: ' + error.message });
  }
});

// ===== PUT - Update =====
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (Object.prototype.hasOwnProperty.call(updateData, 'slug')) {
      if (!updateData.slug) return res.status(400).json({ error: 'Slug não pode ser vazio' });
      if (!SLUG_REGEX.test(updateData.slug)) return res.status(400).json({ error: 'Slug em formato inválido' });
      const exists = await AsianContent.findOne({
        where: { slug: updateData.slug, id: { [Op.ne]: id } },
        attributes: ['id'],
      });
      if (exists) return res.status(409).json({ error: 'Slug já em uso' });
    } else {
      delete updateData.slug;
    }

    const asianContent = await AsianContent.findByPk(id);
    if (!asianContent) return res.status(404).json({ error: 'Conteúdo asiático não encontrado' });

    await asianContent.update(updateData);
    res.status(200).json(asianContent);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar conteúdo asiático: ' + error.message });
  }
});

// ===== DELETE =====
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const asianContent = await AsianContent.findByPk(id);
    if (!asianContent) return res.status(404).json({ error: 'Conteúdo asiático não encontrado' });

    await asianContent.destroy();
    res.status(200).json({ message: 'Conteúdo asiático deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar conteúdo asiático: ' + error.message });
  }
});

module.exports = router;
