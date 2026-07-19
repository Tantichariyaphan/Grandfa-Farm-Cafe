// services/coupon/qrSessionService.js
// Manages one-time QR sessions for coupon redemption.
// Each session expires after a configurable time and can only be used once.

const { query, withTransaction } = require('../../database/db');
const { signCouponSessionToken, verify: verifyQrToken } = require('../../utils/qrToken');
const AppError = require('../../utils/AppError');
const config = require('../../config');
const crypto = require('crypto');
const QRCode = require('qrcode');

/**
 * Generates a new QR session for a coupon.
 * Invalidates any previous active sessions for this coupon.
 *
 * @param {number} memberId
 * @param {number} couponId
 * @param {string} couponCode
 * @returns {Promise<{sessionId: string, qrCode: string, expiresIn: number, expiresAt: Date}>}
 */
async function generateQrSession(memberId, couponId, couponCode) {
  const sessionId = crypto.randomBytes(16).toString('hex');
  const expiresInMinutes = config.qrSession.expiresInMinutes;
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  // Invalidate any previous active sessions for this coupon
  await query(
    `UPDATE coupon_qr_sessions SET used_at = NOW()
     WHERE coupon_id = $1 AND used_at IS NULL AND expires_at > NOW()`,
    [couponId]
  );

  // Generate signed token with session ID and expiration
  const qrToken = signCouponSessionToken(sessionId, couponCode, expiresInMinutes);

  // Generate QR code PNG
  const qrCode = await QRCode.toDataURL(qrToken, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 400,
    color: { dark: '#3E2723', light: '#FFFFFF' },
  });

  // Store session in database
  await query(
    `INSERT INTO coupon_qr_sessions (id, coupon_id, member_id, qr_token, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [sessionId, couponId, memberId, qrToken, expiresAt]
  );

  return {
    sessionId,
    qrCode,
    expiresIn: expiresInMinutes * 60, // seconds
    expiresAt,
  };
}

/**
 * Validates a QR session token and returns the session data.
 * Throws if session is invalid, expired, or already used.
 *
 * @param {string} qrTokenString
 * @returns {Promise<{sessionId: string, couponCode: string, couponId: number, memberId: number}>}
 */
async function validateQrSession(qrTokenString) {
  const payload = verifyQrToken(qrTokenString);
  if (!payload || payload.t !== 'coupon' || !payload.sid) {
    throw new AppError('Invalid or expired QR code', 400);
  }

  const result = await query(
    `SELECT s.id, s.coupon_id, s.member_id, s.expires_at, s.used_at, c.code
     FROM coupon_qr_sessions s
     JOIN coupons c ON c.id = s.coupon_id
     WHERE s.id = $1 AND c.code = $2`,
    [payload.sid, payload.id]
  );

  const session = result.rows[0];
  if (!session) {
    throw new AppError('QR session not found', 404);
  }

  if (session.used_at) {
    throw new AppError('This QR code has already been used', 409);
  }

  if (new Date(session.expires_at) < new Date()) {
    throw new AppError('This QR code has expired', 410);
  }

  return {
    sessionId: session.id,
    couponCode: session.code,
    couponId: session.coupon_id,
    memberId: session.member_id,
  };
}

/**
 * Marks a QR session as used during redemption.
 * Must be called inside the same transaction as the coupon update.
 *
 * @param {string} sessionId
 * @param {import('pg').PoolClient} client
 */
async function markSessionUsed(sessionId, client) {
  await client.query(
    `UPDATE coupon_qr_sessions SET used_at = NOW() WHERE id = $1`,
    [sessionId]
  );
}

module.exports = {
  generateQrSession,
  validateQrSession,
  markSessionUsed,
};