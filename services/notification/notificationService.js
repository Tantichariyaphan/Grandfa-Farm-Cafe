const { query } = require('../../database/db');
const { pushMessage } = require('../line/push');
const { buildCouponFlex } = require('../line/flexMessage');

async function record(memberId, type, payload, send) {
  const created = await query(`INSERT INTO notifications (member_id, channel, type, payload) VALUES ($1, 'line_push', $2, $3) RETURNING id`, [memberId, type, payload]);
  try {
    await send();
    await query(`UPDATE notifications SET sent_at = NOW() WHERE id = $1`, [created.rows[0].id]);
  } catch (error) {
    await query(`UPDATE notifications SET failed_at = NOW(), error_message = $2 WHERE id = $1`, [created.rows[0].id, error.message.slice(0, 1000)]);
    console.error(`LINE notification failed for member ${memberId}:`, error.message);
  }
}

async function notifyStampAdded(member, stampsAdded) {
  if (!member.line_user_id) return;
  return record(member.id, 'stamp_added', { stampsAdded }, () => pushMessage(member.line_user_id, { type: 'text', text: `You received ${stampsAdded} stamp${stampsAdded === 1 ? '' : 's'}! You now have ${member.current_stamps} stamps.` }));
}
async function notifyRewardEarned(member, coupon) { if (member.line_user_id) return record(member.id, 'reward_earned', { couponCode: coupon.code }, () => pushMessage(member.line_user_id, buildCouponFlex(coupon))); }
async function notifyCouponIssued(member, coupon) { if (member.line_user_id) return record(member.id, 'coupon_issued', { couponCode: coupon.code }, () => pushMessage(member.line_user_id, buildCouponFlex(coupon))); }
async function notifyCouponIssuedBulk(members, couponsByMemberId) { for (const member of members) { const coupon = couponsByMemberId[member.id]; if (coupon) await notifyCouponIssued(member, coupon); } }
module.exports = { notifyStampAdded, notifyRewardEarned, notifyCouponIssued, notifyCouponIssuedBulk };
