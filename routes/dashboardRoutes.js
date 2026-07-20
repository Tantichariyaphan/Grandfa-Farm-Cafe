const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const requireStaffAuth = require('../middleware/staffAuth');
const requireOwnerRole = require('../middleware/ownerAuth');
const { ok, created } = require('../utils/response');
const { getOwnerStatistics, getCouponAnalytics, getMemberAnalytics, getSalesAnalytics } = require('../services/dashboardService');
const { query } = require('../database/db');
const router = express.Router();
router.use(requireStaffAuth, requireOwnerRole);

router.get('/statistics', asyncHandler(async (req, res) => ok(res, await getOwnerStatistics())));
router.get('/coupons', asyncHandler(async (req, res) => ok(res, await getCouponAnalytics())));
router.get('/members', asyncHandler(async (req, res) => ok(res, await getMemberAnalytics())));
router.get('/sales', asyncHandler(async (req, res) => ok(res, await getSalesAnalytics())));

// Chatbot Keywords management (CRUD) - accessible from Owner dashboard
router.get('/keywords', asyncHandler(async (req, res) => {
  const { search, response_type, is_active } = req.query;
  const clauses = [];
  const params = [];
  let idx = 1;

  if (search) {
    clauses.push(`(LOWER(keyword) LIKE LOWER('%' || $${idx} || '%') OR LOWER(response_text) LIKE LOWER('%' || $${idx} || '%'))`);
    params.push(search);
    idx += 1;
  }
  if (response_type) {
    clauses.push(`response_type = $${idx}`);
    params.push(response_type);
    idx += 1;
  }
  if (typeof is_active !== 'undefined') {
    clauses.push(`is_active = $${idx}`);
    params.push(is_active === 'true' || is_active === true);
    idx += 1;
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  // Return sorted by priority desc then keyword for deterministic ordering
  const rowsRes = await query(
    `SELECT id, keyword, response_text, response_type, response_target, priority, is_active, created_at, updated_at
     FROM chat_keywords ${where}
     ORDER BY COALESCE(priority,0) DESC, keyword ASC`,
    params
  );

  return ok(res, { rows: rowsRes.rows, count: rowsRes.rowCount });
}));

router.post('/keywords', asyncHandler(async (req, res) => {
  const body = req.body || {};
  const { keyword, response_type, response_target, response_text, priority } = body;
  if (!keyword || !response_type) {
    throw new Error('keyword and response_type are required');
  }

  // If response_type is knowledge, validate response_target exists
  if (response_type === 'knowledge' && response_target) {
    const k = await query(`SELECT key FROM settings WHERE key = $1`, [response_target]);
    if (!k.rows[0]) {
      throw new Error('response_target must be an existing knowledge key');
    }
  }

  try {
    const result = await query(
      `INSERT INTO chat_keywords (keyword, response_type, response_target, response_text, priority, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, COALESCE($5, 0), TRUE, NOW(), NOW())
       RETURNING id, keyword, response_text, response_type, response_target, priority, is_active, created_at, updated_at`,
      [keyword, response_type, response_target || null, response_text || '', priority || null]
    );
    return ok(res, result.rows[0], 'Keyword created');
  } catch (err) {
    // Handle duplicate keyword error
    if (err && err.code === '23505') {
      throw new Error('Keyword already exists');
    }
    throw err;
  }
}));

router.put('/keywords/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!id) throw new Error('Invalid id');
  const { keyword, response_type, response_target, response_text, priority, is_active } = req.body || {};

  // If response_type is knowledge, validate response_target exists
  if (response_type === 'knowledge' && response_target) {
    const k = await query(`SELECT key FROM settings WHERE key = $1`, [response_target]);
    if (!k.rows[0]) {
      throw new Error('response_target must be an existing knowledge key');
    }
  }

  try {
    const result = await query(
      `UPDATE chat_keywords SET keyword = COALESCE($1, keyword), response_type = COALESCE($2, response_type), response_target = COALESCE($3, response_target), response_text = COALESCE($4, response_text), priority = COALESCE($5, priority), is_active = COALESCE($6, is_active), updated_at = NOW() WHERE id = $7 RETURNING id, keyword, response_text, response_type, response_target, priority, is_active, created_at, updated_at`,
      [keyword || null, response_type || null, response_target || null, response_text || null, priority || null, typeof is_active === 'boolean' ? is_active : null, id]
    );
    if (!result.rows[0]) throw new Error('Keyword not found');
    return ok(res, result.rows[0], 'Keyword updated');
  } catch (err) {
    if (err && err.code === '23505') {
      throw new Error('Keyword already exists');
    }
    throw err;
  }
}));

router.delete('/keywords/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!id) throw new Error('Invalid id');
  const result = await query(`DELETE FROM chat_keywords WHERE id = $1 RETURNING id`, [id]);
  if (!result.rows[0]) throw new Error('Keyword not found');
  return ok(res, result.rows[0], 'Keyword deleted');
}));


// ---- Marketing: Promotions (reuse existing promotionService) ----
const { createPromotion, listPromotions, setPromotionActive } = require('../services/coupon/promotionService');
const { createTemplate, listTemplates, getTemplate, updateTemplate, deleteTemplate } = require('../services/coupon/templateService');

// Promotions endpoints for Owner dashboard
router.get('/marketing/promotions', asyncHandler(async (req, res) => {
  const promos = await listPromotions();
  return ok(res, promos);
}));

router.post('/marketing/promotions', asyncHandler(async (req, res) => {
  const body = req.body || {};
  // accept image, start_at / end_at mapping
  const title = body.title;
  const description = body.description || '';
  const image = body.image || null;
  const validFrom = body.start_at || body.valid_from || body.validFrom || null;
  const validTo = body.end_at || body.valid_to || body.validTo || null;
  const couponType = body.coupon_type || body.couponType || 'promotion';
  if (!title || !validTo) throw new Error('title and end date (end_at) are required');
  const promotion = await createPromotion({ title, description, image, couponType, validFrom, validTo, createdBy: req.staff.id });
  return created(res, promotion, 'Promotion created');
}));

router.patch('/marketing/promotions/:id/active', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!id) throw new Error('Invalid id');
  const isActive = Boolean(req.body.is_active);
  const p = await setPromotionActive(id, isActive);
  return ok(res, p, 'Promotion updated');
}));

router.delete('/marketing/promotions/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!id) throw new Error('Invalid id');
  // soft-delete: set is_active = false
  const p = await setPromotionActive(id, false);
  return ok(res, p, 'Promotion disabled');
}));

// Coupon templates (marketing)
router.get('/marketing/coupon-templates', asyncHandler(async (req, res) => {
  const { search, is_active } = req.query;
  const templates = await listTemplates({ search, isActive: typeof is_active === 'undefined' ? undefined : (String(is_active) === 'true') });
  return ok(res, templates);
}));

router.post('/marketing/coupon-templates', asyncHandler(async (req, res) => {
  const body = req.body || {};
  const tpl = await createTemplate({
    title: body.title,
    description: body.description,
    image: body.image,
    couponType: body.coupon_type || body.couponType,
    couponValue: body.coupon_value || body.couponValue,
    pointCost: body.point_cost || body.pointCost,
    claimStartAt: body.claim_start_at || body.claimStartAt,
    claimEndAt: body.claim_end_at || body.claimEndAt,
    couponExpireDays: body.coupon_expire_days || body.couponExpireDays,
    couponExpireAt: body.coupon_expire_at || body.couponExpireAt,
    quantityLimit: body.quantity_limit || body.quantityLimit,
    isActive: typeof body.is_active === 'undefined' ? true : Boolean(body.is_active),
    createdBy: req.staff.id,
  });
  return created(res, tpl, 'Coupon template created');
}));

router.put('/marketing/coupon-templates/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!id) throw new Error('Invalid id');
  const patch = req.body || {};
  const tpl = await updateTemplate(id, patch);
  return ok(res, tpl, 'Coupon template updated');
}));

router.delete('/marketing/coupon-templates/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!id) throw new Error('Invalid id');
  const tpl = await deleteTemplate(id);
  return ok(res, tpl, 'Coupon template deleted');
}));

// Rewards: show available point-exchange templates and allow toggling
router.get('/marketing/rewards', asyncHandler(async (req, res) => {
  // Return active coupon templates that have a point_cost (point-exchange options)
  const templates = await listTemplates({});
  const exchanges = templates.filter(t => t.point_cost !== null && t.point_cost !== undefined);
  return ok(res, exchanges);
}));

router.patch('/marketing/rewards/:id/toggle', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!id) throw new Error('Invalid id');
  // toggle is_active on the template
  const tpl = await getTemplate(id);
  if (!tpl) throw new Error('Template not found');
  const updated = await updateTemplate(id, { is_active: !tpl.is_active });
  return ok(res, updated, 'Reward option toggled');
}));

module.exports = router;
