const { query } = require('../database/db');

async function getOwnerStatistics() {
  const [members, coupons, transactions, stamps] = await Promise.all([
    query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE is_active)::int AS active FROM members`),
    query(`SELECT COUNT(*)::int AS issued, COUNT(*) FILTER (WHERE status = 'used')::int AS redeemed, COUNT(*) FILTER (WHERE status = 'unused' AND expires_at > NOW())::int AS active FROM coupons`),
    query(`SELECT COUNT(*)::int AS count, COALESCE(SUM(drink_quantity), 0)::int AS drinks FROM transactions WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'`),
    query(`SELECT COALESCE(SUM(quantity), 0)::int AS issued FROM stamps WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'`),
  ]);
  return { members: members.rows[0], coupons: coupons.rows[0], last30Days: { transactions: transactions.rows[0], stamps: stamps.rows[0] } };
}

async function getCouponAnalytics() {
  const result = await query(`SELECT type, COUNT(*)::int AS issued, COUNT(*) FILTER (WHERE status = 'used')::int AS redeemed, COUNT(*) FILTER (WHERE status = 'expired')::int AS expired FROM coupons GROUP BY type ORDER BY type`);
  return result.rows;
}

async function getMemberAnalytics() {
  const result = await query(`SELECT DATE_TRUNC('month', created_at)::date AS month, COUNT(*)::int AS joined FROM members GROUP BY 1 ORDER BY 1 DESC LIMIT 12`);
  return result.rows;
}

async function getSalesAnalytics() {
  const result = await query(`SELECT DATE_TRUNC('day', created_at)::date AS day, COUNT(*)::int AS transactions, COALESCE(SUM(drink_quantity), 0)::int AS drinks, COALESCE(SUM(stamps_earned), 0)::int AS stamps FROM transactions WHERE created_at >= CURRENT_DATE - INTERVAL '30 days' GROUP BY 1 ORDER BY 1`);
  return result.rows;
}

module.exports = { getOwnerStatistics, getCouponAnalytics, getMemberAnalytics, getSalesAnalytics };
