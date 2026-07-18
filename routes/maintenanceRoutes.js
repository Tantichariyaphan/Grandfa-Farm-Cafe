const express = require('express');
const config = require('../config');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');
const { issueBirthdayCoupons } = require('../services/coupon/promotionService');

const router = express.Router();
router.post('/birthday-coupons', asyncHandler(async (req, res) => {
  if (req.get('x-maintenance-token') !== config.maintenanceToken) throw new AppError('Unauthorized maintenance request', 401);
  return ok(res, await issueBirthdayCoupons(), 'Birthday coupons processed');
}));
module.exports = router;
