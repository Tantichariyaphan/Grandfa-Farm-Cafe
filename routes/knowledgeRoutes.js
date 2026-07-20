// routes/knowledgeRoutes.js
// Knowledge Center foundation - JSON only, enhanced with filters and updated_by mapping.
// GET /api/knowledge       - list all knowledge entries (supports search, category, is_active)
// GET /api/knowledge/:key  - get one entry
// PUT /api/knowledge/:key  - create or update one entry; body IS the
//                            knowledge object directly, e.g.
//                            { title, category, content, order }

const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');
const AppError = require('../utils/AppError');
const knowledgeService = require('../services/knowledge/knowledgeService');
const { query } = require('../database/db');
const requireStaffAuth = require('../middleware/staffAuth');
const requireOwnerRole = require('../middleware/ownerAuth');

const router = express.Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { search, category, is_active } = req.query;
    let entries = await knowledgeService.list();
    // entries: { key, value, updated_at }
    if (search) {
      const s = String(search).toLowerCase();
      entries = entries.filter(
        e => (e.key || '').toLowerCase().includes(s) || (String(e.value.title || '') + ' ' + String(e.value.content || '')).toLowerCase().includes(s)
      );
    }
    if (category) {
      entries = entries.filter(e => (e.value && e.value.category) === category);
    }
    if (typeof is_active !== 'undefined') {
      const want = String(is_active) === 'true';
      entries = entries.filter(e => {
        if (e.value && typeof e.value.is_active !== 'undefined') return Boolean(e.value.is_active) === want;
        // treat missing as active
        return want === true;
      });
    }

    // Map updated_by ids to staff display names when available
    const updatedByIds = Array.from(new Set(entries.map(e => e.value && e.value.updated_by).filter(Boolean)));
    let staffMap = {};
    if (updatedByIds.length) {
      const staffRes = await query(`SELECT id, display_name FROM staff WHERE id = ANY($1)`, [updatedByIds]);
      for (const s of staffRes.rows) staffMap[s.id] = s.display_name;
    }

    // Attach updated_by_name and last_updated on value for UI
    entries = entries.map(e => ({
      key: e.key,
      value: {
        ...e.value,
        updated_by_name: e.value && e.value.updated_by ? (staffMap[e.value.updated_by] || null) : null,
      },
      updated_at: e.updated_at,
    }));

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
  requireStaffAuth,
  requireOwnerRole,
  asyncHandler(async (req, res) => {
    const body = req.body;
    const isPlainObject = typeof body === 'object' && body !== null && !Array.isArray(body);

    if (!isPlainObject) {
      throw new AppError('Request body must be a JSON object', 400);
    }

    // Attach updater staff id
    body.updated_by = req.staff ? req.staff.id : null;

    const entry = await knowledgeService.set(req.params.key, body);
    return ok(res, entry, 'Knowledge entry saved');
  })
);

module.exports = router;