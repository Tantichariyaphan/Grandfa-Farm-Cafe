// services/coupon/promotionService.js
// Owner-driven promotional campaigns: create a promotion, issue a
// coupon to every targeted member, and notify them via LINE. Also
// handles the daily birthday-coupon check.

const { query } = require('../../database/db');
const AppError = require('../../utils/AppError');
const { generateCoupon } = require('./couponService');
const { notifyCouponIssuedBulk } = require('../notification/notificationService');

const PROMO_COUPON_TYPES = ['birthday', 'holiday', 'promotion', 'welcome'];

/**
 * Creates a promotion record (metadata only - coupons are issued
 * separately via issuePromotionToAllMembers so the owner can review
 * before sending).
 */
async function createPromotion({ title, description, couponType, validFrom, validTo, createdBy }) {
  if (!PROMO_COUPON_TYPES.includes(couponType)) {
    throw new AppError(`Invalid promotion coupon type: ${couponType}`, 400);
  }
  if (new Date(validTo) <= new Date(validFrom || Date.now())) {
    throw new AppError('validTo must be after validFrom', 400);
  }

  const result = await query(
    `INSERT INTO promotions (title, description, coupon_type, valid_from, valid_to, created_by)
     VALUES ($1, $2, $3, COALESCE($4, NOW()), $5, $6)
     RETURNING id, title, description, coupon_type, valid_from, valid_to, is_active, created_at`,
    [title, description || null, couponType, validFrom || null, validTo, createdBy]
  );
  return result.rows[0];
}

async function listPromotions() {
  const result = await query(
    `SELECT id, title, description, coupon_type, valid_from, valid_to, is_active, created_at
     FROM promotions ORDER BY created_at DESC`
  );
  return result.rows;
}

async function setPromotionActive(promotionId, isActive) {
  const result = await query(
    `UPDATE promotions SET is_active = $2 WHERE id = $1
     RETURNING id, title, is_active`,
    [promotionId, isActive]
  );
  if (!result.rows[0]) {
    throw new AppError('Promotion not found', 404);
  }
  return result.rows[0];
}

/**
 * Issues one coupon per targeted member for a given promotion, then
 * pushes a Flex notification to each. Only active members are targeted.
 *
 * @param {number} promotionId
 * @param {'all'|'active'} audience - 'active' = has a stamp/transaction in last 90 days
 */
async function issuePromotionToMembers(promotionId, audience = 'all') {
  const promoResult = await query(`SELECT * FROM promotions WHERE id = $1`, [promotionId]);
  const promotion = promoResult.rows[0];
  if (!promotion) {
    throw new AppError('Promotion not found', 404);
  }
  if (!promotion.is_active) {
    throw new AppError('Promotion is not active', 400);
  }

  const memberQuery =
    audience === 'active'
      ? `SELECT DISTINCT m.id, m.line_user_id, m.display_name
         FROM members m
         JOIN transactions t ON t.member_id = m.id
         WHERE m.is_active = TRUE AND t.created_at > NOW() - INTERVAL '90 days'`
      : `SELECT id, line_user_id, display_name FROM members WHERE is_active = TRUE`;

  const membersResult = await query(memberQuery);
  const members = membersResult.rows;

  const expiryDays = Math.max(
    1,
    Math.ceil((new Date(promotion.valid_to) - new Date()) / (1000 * 60 * 60 * 24))
  );

  const couponsByMemberId = {};
  for (const member of members) {
    // eslint-disable-next-line no-await-in-loop
    const coupon = await generateCoupon({
      memberId: member.id,
      type: promotion.coupon_type,
      title: promotion.title,
      description: promotion.description,
      expiryDays,
      promotionId: promotion.id,
    });
    couponsByMemberId[member.id] = coupon;
  }

  await notifyCouponIssuedBulk(members, couponsByMemberId);

  return { promotion, issuedCount: members.length };
}

/**
 * Issues a single "birthday coupon" to every member whose birthday
 * (month + day) is today. Intended to be called once per day by a
 * Render Cron Job hitting an internal maintenance route.
 */
async function issueBirthdayCoupons() {
  const membersResult = await query(
    `SELECT id, line_user_id, display_name FROM members
     WHERE is_active = TRUE
       AND birthday IS NOT NULL
       AND EXTRACT(MONTH FROM birthday) = EXTRACT(MONTH FROM CURRENT_DATE)
       AND EXTRACT(DAY FROM birthday) = EXTRACT(DAY FROM CURRENT_DATE)`
  );
  const members = membersResult.rows;
  if (members.length === 0) {
    return { issuedCount: 0 };
  }

  const couponsByMemberId = {};
  for (const member of members) {
    // Prevent issuing a duplicate birthday coupon if the job runs twice.
    // eslint-disable-next-line no-await-in-loop
    const existing = await query(
      `SELECT id FROM coupons
       WHERE member_id = $1 AND type = 'birthday'
         AND issued_at::date = CURRENT_DATE`,
      [member.id]
    );
    if (existing.rows[0]) continue;

    // eslint-disable-next-line no-await-in-loop
    const coupon = await generateCoupon({
      memberId: member.id,
      type: 'birthday',
      title: 'Happy Birthday! Free Drink Coupon',
      description: 'Enjoy a free drink on us this birthday month.',
      expiryDays: 30,
    });
    couponsByMemberId[member.id] = coupon;
  }

  await notifyCouponIssuedBulk(members, couponsByMemberId);
  return { issuedCount: Object.keys(couponsByMemberId).length };
}

module.exports = {
  createPromotion,
  listPromotions,
  setPromotionActive,
  issuePromotionToMembers,
  issueBirthdayCoupons,
};