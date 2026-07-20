// routes/knowledgeRoutes.js
// Knowledge Center foundation - JSON only, no frontend, no auth changes.
// GET /api/knowledge       - list all knowledge entries (ordered by category, order, key)
// GET /api/knowledge/:key  - get one entry
// PUT /api/knowledge/:key  - create or update one entry; body IS the
//                            knowledge object directly, e.g.
//                            { title, category, content, order }

const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');
const AppError = require('../utils/AppError');
const knowledgeService = require('../services/knowledge/knowledgeService');

const router = express.Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const entries = await knowledgeService.list();
    return ok(res, entries);
  })
);

router.get(
  '/:key',
  asyncHandler(async (req, res) => {
    const entry = await knowledgeService.get(req.params.key);
    if (!entry) {
      throw new AppError('Knowledge entry not found', 404);
    }
    return ok(res, entry);
  })
);

router.put(
  '/:key',
  asyncHandler(async (req, res) => {
    const body = req.body;
    const isPlainObject =
      typeof body === 'object' && body !== null && !Array.isArray(body);

    if (!isPlainObject) {
      throw new AppError('Request body must be a JSON object', 400);
    }

    const entry = await knowledgeService.set(req.params.key, body);
    return ok(res, entry, 'Knowledge entry saved');
  })
);

module.exports = router;