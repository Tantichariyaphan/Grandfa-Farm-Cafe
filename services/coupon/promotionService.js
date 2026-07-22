// services/coupon/promotionService.js
// Promotion service: CRUD operations for marketing promotions used by the
// Marketing CMS and the chatbot's latest_promotions dynamic reply.

const { query } = require('../../database/db');
const AppError = require('../../utils/AppError');

const PROMO_COUPON_TYPES = ['birthday', 'holiday', 'promotion', 'welcome'];

/**
 * Creates a promotion record (metadata only).
 */
async function createPromotion({ title, description, image = null, couponType, validFrom, validTo, createdBy }) {
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

module.exports = {
  createPromotion,
  listPromotions,
  setPromotionActive,
};