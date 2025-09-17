// routes/asian.js
const express = require('express');
const router = express.Router();
const { AsianContent, WesternContent, BannedContent, UnknownContent, Vip } = require('../models');
const verifyToken = require('../Middleware/verifyToken');
const isAdmin = require('../Middleware/isAdmin');
const { Op, Sequelize } = require('sequelize');

// ===== util de ofuscação existente =====
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

// ===== util de slug =====
function normalizeName(name) {
  return String(name)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // troca não-alfanumérico por "-"
    .replace(/(^-|-$)/g, '');    // remove traços início/fim
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

// ===== POST - Create Asian content =====
router.post('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const body = req.body;

    if (Array.isArray(body)) {
      const prepared = [];
      for (const item of body) {
        const clone = { ...item };
        if (!clone.slug) {
          clone.slug = await generateSlugFor(AsianContent, clone.postDate, clone.name);
        }
        prepared.push(clone);
      }
      const createdContents = await AsianContent.bulkCreate(prepared, { individualHooks: true });
      return res.status(201).json(createdContents);
    } else {
      const data = { ...body };
      if (!data.slug) {
        data.slug = await generateSlugFor(AsianContent, data.postDate, data.name);
      }
      const createdContent = await AsianContent.create(data);
      return res.status(201).json(createdContent);
    }
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao criar conteúdo asiático: ' + error.message });
  }
});

// ===== GET with search =====
router.get('/search', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { search, category, month, region, sortBy = 'postDate', sortOrder = 'DESC' } = req.query;

    let allResults = [];

    if (search) {
      const searchWhere = { name: { [Op.iLike]: `%${search}%` } };

      if (month) {
        searchWhere.postDate = {
          [Op.and]: [
            Sequelize.where(
              Sequelize.fn('EXTRACT', Sequelize.literal('MONTH FROM "postDate"')),
              month
            )
          ]
        };
      }
      if (category) searchWhere.category = category;
      if (region) searchWhere.region = region;

      const commonOpts = {
        where: searchWhere,
        order: [[sortBy, sortOrder]],
        raw: true
      };

      const [asianResults, westernResults, bannedResults, unknownResults, vipResults] = await Promise.all([
        AsianContent.findAll(commonOpts),
        WesternContent.findAll(commonOpts),
        BannedContent.findAll(commonOpts),
        UnknownContent.findAll(commonOpts),
        Vip.findAll(commonOpts)
      ]);

      const withType = (rows, type) => rows.map(item => ({ ...item, contentType: type }));

      allResults = [
        ...withType(asianResults, 'asian'),
        ...withType(westernResults, 'western'),
        ...withType(bannedResults, 'banned'),
        ...withType(unknownResults, 'unknown'),
        ...withType(vipResults, 'vip')
      ];

      allResults.sort((a, b) => {
        const dateA = new Date(a.postDate);
        const dateB = new Date(b.postDate);
        return sortOrder === 'DESC' ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
      });
    } else {
      const where = {};
      if (category) where.category = category;
      if (region) where.region = region;
      if (month) {
        where.postDate = {
          [Op.and]: [
            Sequelize.where(
              Sequelize.fn('EXTRACT', Sequelize.literal('MONTH FROM "postDate"')),
              month
            )
          ]
        };
      }

      const results = await AsianContent.findAll({
        where,
        order: [[sortBy, sortOrder]],
        raw: true
      });

      allResults = results.map(item => ({ ...item, contentType: 'asian' }));
    }

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
    res.status(500).json({ error: 'Erro ao buscar conteúdos: ' + error.message });
  }
});

// ===== GET all =====
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 150, 150);

    const where = {};
    if (region) where.region = region;

    // Query mais simples e rápida
    const asianContents = await AsianContent.findAll({
      where,
      limit,
      offset,
      order: [['id', 'DESC']], // Usa ID ao invés de postDate para melhor performance
      raw: true,
      timeout: 8000, // 8 segundos
      logging: false
    });

    const totalCount = await AsianContent.count({ where });
    const payload = { 
      page, 
      perPage: limit, 
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      data: asianContents 
    };
    const encodedPayload = encodePayloadToBase64(payload);
    res.status(200).json({ data: encodedPayload });

  } catch (error) {
    console.error('Erro em AsianContent:', error.message);
    const emptyPayload = { 
      page: parseInt(req.query.page) || 1, 
      perPage: Math.min(parseInt(req.query.limit) || 150, 150),
      total: 0,
      totalPages: 0,
      data: [],
      error: 'Timeout na consulta'
    };
    const encodedPayload = encodePayloadToBase64(emptyPayload);
    res.status(200).json({ data: encodedPayload });
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
      if (!updateData.slug) {
        return res.status(400).json({ error: 'Slug não pode ser vazio' });
      }
      if (!SLUG_REGEX.test(updateData.slug)) {
        return res.status(400).json({ error: 'Slug em formato inválido' });
      }
      const exists = await AsianContent.findOne({
        where: { slug: updateData.slug, id: { [Op.ne]: id } },
        attributes: ['id']
      });
      if (exists) return res.status(409).json({ error: 'Slug já em uso' });
    } else {
      delete updateData.slug;
    }

    const asianContent = await AsianContent.findByPk(id);
    if (!asianContent) {
      return res.status(404).json({ error: 'Conteúdo asiático não encontrado' });
    }

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
    if (!asianContent) {
      return res.status(404).json({ error: 'Conteúdo asiático não encontrado' });
    }

    await asianContent.destroy();
    res.status(200).json({ message: 'Conteúdo asiático deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar conteúdo asiático: ' + error.message });
  }
});

module.exports = router;
