// services/coupon/couponService.js
// Core coupon lifecycle: generate, verify (from QR), redeem, expire.
// Every redemption is validated server-side against the database -
// the QR token only ever proves "this code was issued by us"; it does
// NOT prove the coupon is still unused or unexpired. That is always
// re-checked here, inside a transaction, at redemption time.

const { query, withTransaction } = require('../../database/db');
const { generateCouponCode } = require('../../utils/couponCode');
const { verify: verifyQrToken, signCouponToken } = require('../../utils/qrToken');
const { validateQrSession, markSessionUsed } = require('./qrSessionService');
const AppError = require('../../utils/AppError');
const config = require('../../config');

const COUPON_TYPES = ['reward', 'birthday', 'holiday', 'promotion', 'welcome'];

/**
 * Creates a coupon for a member. Retries on the rare unique-code
 * collision. Accepts an optional pg client so it can participate in
 * a caller's transaction (e.g. stampService's stamp-then-reward flow).
 *
 * @param {object} params
 * @param {number} params.memberId
 * @param {'reward'|'birthday'|'holiday'|'promotion'|'welcome'} params.type
 * @param {string} [params.title]
 * @param {string} [params.description]
 * @param {number} [params.expiryDays] - defaults to config.loyalty.couponExpiryDays
 * @param {number|null} [params.createdBy] - staff.id, null = system-generated
 * @param {number|null} [params.promotionId]
 * @param {import('pg').PoolClient} [dbClient] - optional, for use inside a transaction
 */
async function generateCoupon(params, dbClient = null) {
  const {
    memberId,
    type,
    title = defaultTitleForType(type),
    description = null,
    expiryDays = config.loyalty.couponExpiryDays,
    createdBy = null,
    promotionId = null,
  } = params;

  if (!COUPON_TYPES.includes(type)) {
    throw new AppError(`Invalid coupon type: ${type}`, 400);
  }

  const runner = dbClient ? (text, values) => dbClient.query(text, values) : query;

  const MAX_ATTEMPTS = 5;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const code = generateCouponCode();
    try {
      // eslint-disable-next-line no-await-in-loop
      const result = await runner(
        `INSERT INTO coupons (code, member_id, type, title, description, expires_at, created_by, promotion_id)
         VALUES ($1, $2, $3, $4, $5, NOW() + ($6 || ' days')::interval, $7, $8)
         RETURNING id, code, member_id, type, status, title, description, issued_at, expires_at, created_by, promotion_id`,
        [code, memberId, type, title, description, expiryDays, createdBy, promotionId]
      );
      return result.rows[0];
    } catch (err) {
      const isUniqueViolation = err.code === '23505' && String(err.constraint).includes('code');
      if (!isUniqueViolation || attempt === MAX_ATTEMPTS - 1) {
        throw err;
      }
      // else: code collision, loop again with a freshly generated code
    }
  }
  throw new AppError('Failed to generate a unique coupon code', 500);
}

function defaultTitleForType(type) {
  const titles = {
    reward: 'Free Drink Coupon',
    birthday: 'Happy Birthday Coupon',
    holiday: 'Holiday Special Coupon',
    promotion: 'Promotion Coupon',
    welcome: 'Welcome Coupon',
  };
  return titles[type] || 'Grandfa Cafe Coupon';
}

/**
 * Resolves a scanned coupon QR token into the underlying coupon row,
 * WITHOUT marking it used. Used by the staff app to preview details
 * before confirming redemption. Does not trust QR expiry/status claims
 * - re-reads the live row from the database.
 *
 * @param {string} qrTokenString
 */
async function resolveCouponFromToken(qrTokenString) {
  const payload = verifyQrToken(qrTokenString);
  if (!payload || payload.t !== 'coupon') {
    throw new AppError('Invalid or unrecognized coupon QR code', 400);
  }

  const result = await query(
    `SELECT c.id, c.code, c.member_id, c.type, c.status, c.title, c.description,
            c.issued_at, c.expires_at, c.used_at,
            m.display_name AS member_name, m.member_uid
     FROM coupons c
     JOIN members m ON m.id = c.member_id
     WHERE c.code = $1`,
    [payload.id]
  );

  const coupon = result.rows[0];
  if (!coupon) {
    throw new AppError('Coupon not found', 404);
  }

  return coupon;
}

/**
 * Redeems a coupon. Performs all security checks inside a single
 * transaction with a row lock, so two simultaneous scans of the same
 * coupon cannot both succeed.
 *
 * @param {string} couponCode
 * @param {number} staffId
 * @param {string} [sessionId] - QR session ID for validation
 */
async function redeemCoupon(couponCode, staffId, sessionId = null) {
  return withTransaction(async (client) => {
    // Validate QR session if provided
    let sessionData = null;
    if (sessionId) {
      try {
        const result = await client.query(
          `SELECT s.id, s.coupon_id, s.member_id, s.expires_at, s.used_at, c.code
           FROM coupon_qr_sessions s
           JOIN coupons c ON c.id = s.coupon_id
           WHERE s.id = $1 AND c.code = $2`,
          [sessionId, couponCode]
        );

        sessionData = result.rows[0];
        if (!sessionData) {
          throw new AppError('Invalid QR session', 400);
        }

        if (sessionData.used_at) {
          throw new AppError('This QR code has already been used', 409);
        }

        if (new Date(sessionData.expires_at) < new Date()) {
          throw new AppError('This QR code has expired', 410);
        }
      } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError('QR session validation failed', 400);
      }
    }

    const result = await client.query(
      `SELECT id, code, member_id, type, status, title, expires_at, used_at
       FROM coupons WHERE code = $1 FOR UPDATE`,
      [couponCode]
    );

    const coupon = result.rows[0];
    if (!coupon) {
      throw new AppError('Coupon not found', 404);
    }

    if (coupon.status === 'used') {
      throw new AppError('This coupon has already been used', 409);
    }
    if (coupon.status === 'cancelled') {
      throw new AppError('This coupon has been cancelled', 409);
    }

    const isExpired = coupon.status === 'expired' || new Date(coupon.expires_at) < new Date();
    if (isExpired) {
      await client.query(`UPDATE coupons SET status = 'expired' WHERE id = $1`, [coupon.id]);
      throw new AppError('This coupon has expired', 409);
    }

    const updated = await client.query(
      `UPDATE coupons SET status = 'used', used_at = NOW()
       WHERE id = $1
       RETURNING id, code, member_id, type, status, title, used_at`,
      [coupon.id]
    );

    // Mark QR session as used if provided
    if (sessionId) {
      await client.query(
        `UPDATE coupon_qr_sessions SET used_at = NOW() WHERE id = $1`,
        [sessionId]
      );
    }

    // Unique constraint on coupon_redemptions.coupon_id guarantees a
    // coupon can only ever be logged as redeemed once, even under race.
    await client.query(
      `INSERT INTO coupon_redemptions (coupon_id, staff_id, qr_session_id) VALUES ($1, $2, $3)`,
      [coupon.id, staffId, sessionId]
    );

    const memberResult = await client.query(
      `SELECT id, line_user_id, display_name FROM members WHERE id = $1`,
      [coupon.member_id]
    );

    return { coupon: updated.rows[0], member: memberResult.rows[0] };
  });
}

/**
 * Marks any unused-but-past-expiry coupons as expired. Safe to call
 * frequently (e.g. from a Render Cron Job hitting an internal route,
 * or opportunistically before listing a member's coupons).
 */
async function expireOverdueCoupons() {
  const result = await query(
    `UPDATE coupons SET status = 'expired'
     WHERE status = 'unused' AND expires_at < NOW()
     RETURNING id`
  );
  return result.rowCount;
}

async function listMemberCoupons(memberId, statusFilter = null) {
  await expireOverdueCoupons();

  const params = [memberId];
  let statusClause = '';
  if (statusFilter) {
    params.push(statusFilter);
    statusClause = ' AND status = $2';
  }

  const result = await query(
    `SELECT id, code, type, status, title, description, issued_at, expires_at, used_at
     FROM coupons
     WHERE member_id = $1 ${statusClause}
     ORDER BY issued_at DESC`,
    params
  );
  return result.rows;
}

function buildCouponQrToken(couponCode) {
  return signCouponToken(couponCode);
}

module.exports = {
  generateCoupon,
  resolveCouponFromToken,
  redeemCoupon,
  expireOverdueCoupons,
  listMemberCoupons,
  buildCouponQrToken,
  COUPON_TYPES,
};