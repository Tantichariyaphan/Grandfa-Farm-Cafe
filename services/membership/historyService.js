// services/membership/historyService.js
// Read-only history queries for a member's own transactions, stamps,
// and rewards. All paginated to keep responses bounded.

const { query } = require('../../database/db');

function parsePagination(page, limit) {
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const offset = (safePage - 1) * safeLimit;
  return { safePage, safeLimit, offset };
}

async function getTransactionHistory(memberId, { page = 1, limit = 20 } = {}) {
  const { safePage, safeLimit, offset } = parsePagination(page, limit);

  const result = await query(
    `SELECT t.id, t.drink_quantity, t.stamps_earned, t.created_at,
            s.display_name AS staff_name
     FROM transactions t
     JOIN staff s ON s.id = t.staff_id
     WHERE t.member_id = $1
     ORDER BY t.created_at DESC
     LIMIT $2 OFFSET $3`,
    [memberId, safeLimit, offset]
  );

  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM transactions WHERE member_id = $1`,
    [memberId]
  );

  return {
    items: result.rows,
    page: safePage,
    limit: safeLimit,
    total: countResult.rows[0].total,
  };
}

async function getRewardHistory(memberId, { page = 1, limit = 20 } = {}) {
  const { safePage, safeLimit, offset } = parsePagination(page, limit);

  const result = await query(
    `SELECT rh.id, rh.stamps_used, rh.created_at,
            c.code, c.title, c.status, c.expires_at, c.used_at
     FROM reward_history rh
     JOIN coupons c ON c.id = rh.coupon_id
     WHERE rh.member_id = $1
     ORDER BY rh.created_at DESC
     LIMIT $2 OFFSET $3`,
    [memberId, safeLimit, offset]
  );

  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM reward_history WHERE member_id = $1`,
    [memberId]
  );

  return {
    items: result.rows,
    page: safePage,
    limit: safeLimit,
    total: countResult.rows[0].total,
  };
}

module.exports = { getTransactionHistory, getRewardHistory };