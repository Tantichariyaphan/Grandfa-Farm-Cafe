// routes/memberRoutes.js
// All routes here require a valid member (LIFF customer) session.
// GET  /api/member/profile
// PUT  /api/member/profile
// GET  /api/member/card
// GET  /api/member/coupons
// GET  /api/member/coupons/:code/qr
// GET  /api/member/stamps/history
// GET  /api/member/rewards/history

const express = require('express');
const { body, query: queryValidator, param } = require('express-validator');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const requireMemberAuth = require('../middleware/auth');
const { ok } = require('../utils/response');

const { getProfile, updateProfile } = require('../services/membership/profileService');
const { buildMemberCard } = require('../services/membership/memberCardService');
const { getTransactionHistory, getRewardHistory } = require('../services/membership/historyService');
const { listMemberCoupons, buildCouponQrToken } = require('../services/coupon/couponService');
const AppError = require('../utils/AppError');
const QRCode = require('qrcode');

const router = express.Router();

router.use(requireMemberAuth);

router.get(
  '/profile',
  asyncHandler(async (req, res) => {
    const profile = await getProfile(req.member.id);
    return ok(res, profile);
  })
);

router.put(
  '/profile',
  validate([
    body('phone').optional({ nullable: true }).isString().isLength({ max: 20 }),
    body('birthday').optional({ nullable: true }).isISO8601().withMessage('birthday must be YYYY-MM-DD'),
  ]),
  asyncHandler(async (req, res) => {
    const updated = await updateProfile(req.member.id, req.body);
    return ok(res, updated, 'Profile updated');
  })
);

router.get(
  '/card',
  asyncHandler(async (req, res) => {
    const profile = await getProfile(req.member.id);
    const card = await buildMemberCard(profile);
    return ok(res, card);
  })
);

router.get(
  '/coupons',
  validate([queryValidator('status').optional().isIn(['unused', 'used', 'expired', 'cancelled'])]),
  asyncHandler(async (req, res) => {
    const coupons = await listMemberCoupons(req.member.id, req.query.status || null);
    return ok(res, coupons);
  })
);

// Renders the coupon's redemption QR as a PNG data URL. The member
// must own the coupon - enforced by filtering listMemberCoupons by
// their own member id rather than trusting a code passed from outside.
router.get(
  '/coupons/:code/qr',
  validate([param('code').isString().notEmpty()]),
  asyncHandler(async (req, res) => {
    const coupons = await listMemberCoupons(req.member.id);
    const coupon = coupons.find((c) => c.code === req.params.code);
    if (!coupon) {
      throw new AppError('Coupon not found', 404);
    }
    if (coupon.status !== 'unused') {
      throw new AppError(`This coupon is ${coupon.status} and cannot be shown for redemption`, 400);
    }

    const token = buildCouponQrToken(coupon.code);
    const qrDataUrl = await QRCode.toDataURL(token, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 400,
      color: { dark: '#3E2723', light: '#FFFFFF' },
    });

    return ok(res, { qrCode: qrDataUrl, coupon });
  })
);

router.get(
  '/stamps/history',
  validate([
    queryValidator('page').optional().isInt({ min: 1 }),
    queryValidator('limit').optional().isInt({ min: 1, max: 100 }),
  ]),
  asyncHandler(async (req, res) => {
    const history = await getTransactionHistory(req.member.id, req.query);
    return ok(res, history);
  })
);

router.get(
  '/rewards/history',
  validate([
    queryValidator('page').optional().isInt({ min: 1 }),
    queryValidator('limit').optional().isInt({ min: 1, max: 100 }),
  ]),
  asyncHandler(async (req, res) => {
    const history = await getRewardHistory(req.member.id, req.query);
    return ok(res, history);
  })
);

module.exports = router;
