// services/stamp/stampService.js
// Core loyalty mechanic: staff scans a member's QR, enters a drink
// quantity, and the server atomically records the transaction, adds
// stamps, and generates a reward coupon whenever the threshold is
// crossed - even if crossed multiple times in one transaction.

const { query, withTransaction } = require('../../database/db');
const { verify: verifyQrToken } = require('../../utils/qrToken');
const AppError = require('../../utils/AppError');
const config = require('../../config');
const { generateCoupon } = require('../coupon/couponService');
const { notifyStampAdded, notifyRewardEarned } = require('../notification/notificationService');

/**
 * Resolves a scanned member QR token into the member's public info,
 * for staff to confirm identity before entering a drink quantity.
 * @param {string} qrTokenString
 */
async function scanMember(qrTokenString) {
  const payload = verifyQrToken(qrTokenString);
  if (!payload || payload.t !== 'member') {
    throw new AppError('Invalid or unrecognized member QR code', 400);
  }

  const result = await query(
    `SELECT id, member_uid, display_name, picture_url, current_stamps, points, is_active
     FROM members WHERE member_uid = $1`,
    [payload.id]
  );

  const member = result.rows[0];
  if (!member) {
    throw new AppError('Member not found', 404);
  }
  if (!member.is_active) {
    throw new AppError('This member account has been deactivated', 403);
  }

  return member;
}

/**
 * Adds stamps for a purchase and auto-generates reward coupon(s) if
 * the stamp threshold is reached (possibly more than once in a single
 * large purchase). Fully atomic - all-or-nothing.
 *
 * @param {object} params
 * @param {string} params.memberUid
 * @param {number} params.staffId
 * @param {number} params.drinkQuantity
 * @param {string} [params.idempotencyKey] - client-generated key to make
 *   a double-tap / retried request safe (prevents duplicate stamping).
 */
async function addStamp({ memberUid, staffId, drinkQuantity, idempotencyKey = null }) {
  if (!Number.isInteger(drinkQuantity) || drinkQuantity <= 0) {
    throw new AppError('Drink quantity must be a positive whole number', 400);
  }
  if (drinkQuantity > 50) {
    throw new AppError('Drink quantity looks too high for a single transaction', 400);
  }

  const threshold = config.loyalty.stampsRequiredForReward;

  const outcome = await withTransaction(async (client) => {
    // Idempotency: if this exact request was already processed, return
    // the prior result instead of double-stamping.
    if (idempotencyKey) {
      const existing = await client.query(
        `SELECT id FROM transactions WHERE idempotency_key = $1`,
        [idempotencyKey]
      );
      if (existing.rows[0]) {
        throw new AppError('This transaction was already submitted', 409, {
          transactionId: existing.rows[0].id,
        });
      }
    }

    const memberResult = await client.query(
      `SELECT id, line_user_id, display_name, current_stamps, is_active
       FROM members WHERE member_uid = $1 FOR UPDATE`,
      [memberUid]
    );

    const member = memberResult.rows[0];
    if (!member) {
      throw new AppError('Member not found', 404);
    }
    if (!member.is_active) {
      throw new AppError('This member account has been deactivated', 403);
    }

    const txResult = await client.query(
      `INSERT INTO transactions (member_id, staff_id, drink_quantity, stamps_earned, idempotency_key)
       VALUES ($1, $2, $3, $3, $4)
       RETURNING id, created_at`,
      [member.id, staffId, drinkQuantity, idempotencyKey]
    );
    const transaction = txResult.rows[0];

    await client.query(
      `INSERT INTO stamps (member_id, transaction_id, quantity) VALUES ($1, $2, $3)`,
      [member.id, transaction.id, drinkQuantity]
    );

    let runningStamps = member.current_stamps + drinkQuantity;
    const newCoupons = [];

    // Handle crossing the threshold one or more times in one purchase.
    while (runningStamps >= threshold) {
      runningStamps -= threshold;

      // eslint-disable-next-line no-await-in-loop
      const coupon = await generateCoupon(
        {
          memberId: member.id,
          type: 'reward',
          title: 'Free Drink Coupon',
          description: `Earned by collecting ${threshold} stamps.`,
        },
        client
      );
      newCoupons.push(coupon);

      // eslint-disable-next-line no-await-in-loop
      await client.query(
        `INSERT INTO reward_history (member_id, coupon_id, stamps_used) VALUES ($1, $2, $3)`,
        [member.id, coupon.id, threshold]
      );
    }

    const updatedMemberResult = await client.query(
      `UPDATE members
       SET current_stamps = $2,
           total_stamps_earned = total_stamps_earned + $3
       WHERE id = $1
       RETURNING id, member_uid, line_user_id, display_name, current_stamps, total_stamps_earned, points`,
      [member.id, runningStamps, drinkQuantity]
    );

    return {
      member: updatedMemberResult.rows[0],
      transaction,
      newCoupons,
      stampsAdded: drinkQuantity,
    };
  });

  // Notifications happen AFTER the transaction commits successfully,
  // so a LINE API hiccup never rolls back a real database change.
  await notifyStampAdded(outcome.member, outcome.stampsAdded);
  for (const coupon of outcome.newCoupons) {
    // eslint-disable-next-line no-await-in-loop
    await notifyRewardEarned(outcome.member, coupon);
  }

  return {
    stamps_earned: outcome.stampsAdded,
    new_stamp_count: outcome.member.current_stamps,
    total_stamps_earned: outcome.member.total_stamps_earned,
    newCoupons: outcome.newCoupons,
    member: outcome.member,
  };
}

module.exports = { scanMember, addStamp };