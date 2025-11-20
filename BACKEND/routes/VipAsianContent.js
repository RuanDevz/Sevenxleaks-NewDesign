const express = require('express');
const router = express.Router();
const { VipAsianContent } = require('../models');
const verifyToken = require('../Middleware/verifyToken');
const isAdmin = require('../Middleware/isAdmin');
const { Op, Sequelize } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { VipWesternContent, VipBannedContent, VipUnknownContent } = require('../models');

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

// POST - Create VIP Asian content
router.post('/', verifyToken, isAdmin, async (req, res) => {
  try {
    let vipAsianContents = req.body;

    if (Array.isArray(vipAsianContents)) {
      for (let i = 0; i < vipAsianContents.length; i++) {
        vipAsianContents[i].slug = uuidv4();
      }
      const createdContents = await VipAsianContent.bulkCreate(vipAsianContents);
      return res.status(201).json(createdContents);
    } else {
      vipAsianContents.slug = uuidv4();
      const createdContent = await VipAsianContent.create(vipAsianContents);
      return res.status(201).json(createdContent);
    }
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao criar conteúdo VIP asiático: ' + error.message });
  }
});

// GET with search
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

      const [vipAsianResults, vipWesternResults, vipBannedResults, vipUnknownResults] = await Promise.all([
        VipAsianContent.findAll(commonOpts),
        VipWesternContent.findAll(commonOpts),
        VipBannedContent.findAll(commonOpts),
        VipUnknownContent.findAll(commonOpts)
      ]);

      const withType = (rows, type) => rows.map(item => ({ ...item, contentType: type }));
      allResults = [
        ...withType(vipAsianResults, 'vip-asian'),
        ...withType(vipWesternResults, 'vip-western'),
        ...withType(vipBannedResults, 'vip-banned'),
        ...withType(vipUnknownResults, 'vip-unknown')
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

      const results = await VipAsianContent.findAll({
        where,
        order: [[sortBy, sortOrder]],
        raw: true
      });

      allResults = results.map(item => ({ ...item, contentType: 'vip-asian' }));
    }
    
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
    res.status(500).json({ error: 'Erro ao buscar conteúdos VIP asiáticos: ' + error.message });
  }
});

// GET all
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 300;
    const offset = (page - 1) * limit;
    const { region } = req.query;

    const where = {};
    if (region) where.region = region;

    const vipAsianContents = await VipAsianContent.findAll({
      where,
      limit,
      offset,
      order: [['postDate', 'DESC']],
      raw: true
    });

    const totalCount = await VipAsianContent.count({ where });
    const payload = {
      page,
      perPage: limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      data: vipAsianContents
    };

    const encodedPayload = encodePayloadToBase64(payload);
    res.status(200).json({ data: encodedPayload });

  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar conteúdos VIP asiáticos: ' + error.message });
  }
});

// GET by slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const vipAsianContent = await VipAsianContent.findOne({ where: { slug } });

    if (!vipAsianContent) {
      return res.status(404).json({ error: 'Conteúdo VIP asiático não encontrado com esse slug' });
    }

    const encodedContent = encodePayloadToBase64(vipAsianContent);
    res.status(200).json({ data: encodedContent });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar conteúdo VIP asiático por slug: ' + error.message });
  }
});

// PUT - Update
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const vipAsianContent = await VipAsianContent.findByPk(id);
    if (!vipAsianContent) {
      return res.status(404).json({ error: 'Conteúdo VIP asiático não encontrado' });
    }

    await vipAsianContent.update(updateData);
    res.status(200).json(vipAsianContent);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar conteúdo VIP asiático: ' + error.message });
  }
});

// DELETE
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const vipAsianContent = await VipAsianContent.findByPk(id);
    if (!vipAsianContent) {
      return res.status(404).json({ error: 'Conteúdo VIP asiático não encontrado' });
    }

    await vipAsianContent.destroy();
    res.status(200).json({ message: 'Conteúdo VIP asiático deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar conteúdo VIP asiático: ' + error.message });
  }
});

module.exports = router;