'use strict';

// services/coupon/couponVerificationService.js
// Ownership: coupon verification & redemption domain
// This file delegates to the existing couponService implementation which
// contains the transactional redemption logic. The file exists to establish
// the verification service boundary required by the project architecture.

const couponService = require('./couponService');

module.exports = {
  // Resolve a scanned QR token into a coupon (delegates to couponService)
  resolveCouponFromToken: couponService.resolveCouponFromToken,

  // Redeem a coupon (staff-only). Delegates to couponService.redeemCoupon
  // which performs the full transactional verification and redemption.
  redeemCoupon: couponService.redeemCoupon,

  // Re-export other verification-related helpers if needed in future.
  expireOverdueCoupons: couponService.expireOverdueCoupons,
  listMemberCoupons: couponService.listMemberCoupons,
  buildCouponQrToken: couponService.buildCouponQrToken,
};
