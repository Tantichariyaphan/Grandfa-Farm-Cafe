// routes/promotionRoutes.js
// All routes require owner authentication.
// POST /api/promotion              - create a promotion
// GET  /api/promotion               - list promotions
// PATCH /api/promotion/:id/active   - activate/deactivate
// POST /api/promotion/:id/issue     - issue coupons + notify members
// POST /api/promotion/birthday/run  - manually trigger birthday coupon issuance

const express = require('express');
const { body, param } = require('express-validator');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const requireStaffAuth = require('../middleware/staffAuth');
const requireOwnerRole = require('../middleware/ownerAuth');
const { ok, created } = require('../utils/response');
const {
  createPromotion,
  listPromotions,
  setPromotionActive,
  issuePromotionToMembers,
  issueBirthdayCoupons,
} = require('../services/coupon/promotionService');

const router = express.Router();

router.use(requireStaffAuth, requireOwnerRole);

router.post(
  '/',
  validate([
    body('title').isString().notEmpty(),
    body('description').optional().isString(),
    body('couponType').isIn(['birthday', 'holiday', 'promotion', 'welcome']),
    body('validFrom').optional().isISO8601(),
    body('validTo').isISO8601(),
  ]),
  asyncHandler(async (req, res) => {
    const promotion = await createPromotion({ ...req.body, createdBy: req.staff.id });
    return created(res, promotion, 'Promotion created');
  })
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const promotions = await listPromotions();
    return ok(res, promotions);
  })
);

router.patch(
  '/:id/active',
  validate([param('id').isInt(), body('isActive').isBoolean()]),
  asyncHandler(async (req, res) => {
    const promotion = await setPromotionActive(req.params.id, req.body.isActive);
    return ok(res, promotion, 'Promotion updated');
  })
);

router.post(
  '/:id/issue',
  validate([param('id').isInt(), body('audience').optional().isIn(['all', 'active'])]),
  asyncHandler(async (req, res) => {
    const result = await issuePromotionToMembers(req.params.id, req.body.audience || 'all');
    return ok(res, result, 'Promotion issued to members');
  })
);

router.post(
  '/birthday/run',
  asyncHandler(async (req, res) => {
    const result = await issueBirthdayCoupons();
    return ok(res, result, 'Birthday coupons processed');
  })
);

module.exports = router;
