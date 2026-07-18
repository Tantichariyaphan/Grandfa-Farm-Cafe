const { query } = require('../../database/db');
const AppError = require('../../utils/AppError');
const { generateCouponCode } = require('../../utils/couponCode');
const { signCouponToken, verify: verifyQrToken } = require('../../utils/qrToken');
const config = require('../../config');

function dbFor(client) { return client || { query }; }

async function generateCoupon({ memberId, type, title, description = null, expiryDays = config.loyalty.couponExpiryDays, promotionId = null }, client = null) {
  const database = dbFor(client);
  const safeDays = Number.parseInt(expiryDays, 10);
  if (!Number.isInteger(safeDays) || safeDays < 1 || safeDays > 3650) throw new AppError('Coupon expiry must be between 1 and 3650 days', 400);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const result = await database.query(
        `INSERT INTO coupons (code, member_id, promotion_id, type, title, description, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW() + ($7 * INTERVAL '1 day'))
         RETURNING id, code, member_id, promotion_id, type, title, description, status, expires_at, issued_at`,
        [generateCouponCode(), memberId, promotionId, type, title, description, safeDays]
      );
      return result.rows[0];
    } catch (error) {
      if (error.code !== '23505' || attempt === 2) throw error;
    }
  }
  throw new AppError('Unable to issue coupon', 500);
}

async function expireCoupons() {
  await query(`UPDATE coupons SET status = 'expired' WHERE status = 'unused' AND expires_at <= NOW()`);
}

async function listMemberCoupons(memberId, status = null) {
  await expireCoupons();
  const values = [memberId];
  let sql = `SELECT id, code, type, title, description, status, expires_at, issued_at, used_at FROM coupons WHERE member_id = $1`;
  if (status) { values.push(status); sql += ` AND status = $2`; }
  const result = await query(`${sql} ORDER BY expires_at ASC`, values);
  return result.rows;
}

function buildCouponQrToken(code) { return signCouponToken(code); }

async function resolveCouponFromToken(token) {
  const payload = verifyQrToken(token);
  if (!payload || payload.t !== 'coupon' || typeof payload.id !== 'string') throw new AppError('Invalid coupon QR code', 400);
  await expireCoupons();
  const result = await query(
    `SELECT c.id, c.code, c.member_id, c.type, c.title, c.description, c.status, c.expires_at,
            m.member_uid, m.display_name
     FROM coupons c JOIN members m ON m.id = c.member_id WHERE c.code = $1`, [payload.id]
  );
  if (!result.rows[0]) throw new AppError('Coupon not found', 404);
  return result.rows[0];
}

async function redeemCoupon(code, staffId) {
  await expireCoupons();
  const result = await query(
    `UPDATE coupons SET status = 'used', used_at = NOW(), used_by = $2
     WHERE code = $1 AND status = 'unused' AND expires_at > NOW()
     RETURNING id, code, member_id, type, title, status, used_at`, [code, staffId]
  );
  if (result.rows[0]) return result.rows[0];
  const existing = await query(`SELECT status FROM coupons WHERE code = $1`, [code]);
  if (!existing.rows[0]) throw new AppError('Coupon not found', 404);
  throw new AppError(`Coupon cannot be redeemed because it is ${existing.rows[0].status}`, 409);
}

module.exports = { generateCoupon, expireCoupons, listMemberCoupons, buildCouponQrToken, resolveCouponFromToken, redeemCoupon };
