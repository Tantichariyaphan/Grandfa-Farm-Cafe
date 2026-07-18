// routes/couponRoutes.js
// All routes require staff authentication.
// POST /api/coupon/resolve - preview a scanned coupon before redeeming
// POST /api/coupon/redeem  - mark a coupon as used

const express = require('express');
const { body } = require('express-validator');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const requireStaffAuth = require('../middleware/staffAuth');
const { ok } = require('../utils/response');
const { resolveCouponFromToken, redeemCoupon } = require('../services/coupon/couponService');

const router = express.Router();

router.use(requireStaffAuth);

router.post(
  '/resolve',
  validate([body('qrToken').isString().notEmpty().withMessage('qrToken is required')]),
  asyncHandler(async (req, res) => {
    const coupon = await resolveCouponFromToken(req.body.qrToken);
    return ok(res, coupon, 'Coupon found');
  })
);

router.post(
  '/redeem',
  validate([body('code').isString().notEmpty().withMessage('code is required')]),
  asyncHandler(async (req, res) => {
    const result = await redeemCoupon(req.body.code, req.staff.id);
    return ok(res, result, 'Coupon redeemed');
  })
);

module.exports = router;
