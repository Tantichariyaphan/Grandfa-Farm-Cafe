// services/notification/notificationService.js
// Semantic notification events built on top of the low-level LINE
// services (push/multicast/broadcast) and Flex message builders.
// All notification calls are best-effort: a LINE API failure must
// never roll back a successful stamp/coupon database transaction, so
// every function here swallows and logs its own errors.

const { pushMessage } = require('../line/push');
const { multicastMessage } = require('../line/multicast');
const { broadcastMessage } = require('../line/broadcast');
const { buildStampProgressFlex, buildCouponFlex } = require('../line/flexMessage');
const config = require('../../config');

function safe(promise, context) {
  return promise.catch((err) => {
    // eslint-disable-next-line no-console
    console.error(`Notification failed [${context}]:`, err.message);
  });
}

/**
 * Sent right after staff adds stamps for a purchase.
 */
async function notifyStampAdded(member, stampsAdded) {
  const text = {
    type: 'text',
    text: `Thanks for your purchase, ${member.display_name}! You earned ${stampsAdded} stamp(s).`,
  };
  const progressFlex = buildStampProgressFlex(member, config.loyalty.stampsRequiredForReward);
  return safe(pushMessage(member.line_user_id, [text, progressFlex]), 'notifyStampAdded');
}

/**
 * Sent when a member crosses the stamp threshold and earns a coupon.
 */
async function notifyRewardEarned(member, coupon) {
  const text = {
    type: 'text',
    text: `🎉 Congratulations! You collected enough stamps and earned a Free Drink Coupon!`,
  };
  return safe(pushMessage(member.line_user_id, [text, buildCouponFlex(coupon)]), 'notifyRewardEarned');
}

/**
 * Sent when the owner issues a promotional/birthday/welcome coupon
 * to a single member.
 */
async function notifyCouponIssued(member, coupon) {
  return safe(pushMessage(member.line_user_id, buildCouponFlex(coupon)), 'notifyCouponIssued');
}

/**
 * Sent to a specific list of members (e.g. all with a birthday today).
 */
async function notifyCouponIssuedBulk(members, couponsByMemberId) {
  const tasks = members.map((member) => {
    const coupon = couponsByMemberId[member.id];
    if (!coupon) return Promise.resolve();
    return safe(pushMessage(member.line_user_id, buildCouponFlex(coupon)), 'notifyCouponIssuedBulk');
  });
  return Promise.all(tasks);
}

/**
 * Owner broadcast to every LINE OA follower.
 */
async function broadcastToAllFollowers(messageText) {
  const message = { type: 'text', text: messageText };
  return safe(broadcastMessage(message), 'broadcastToAllFollowers');
}

/**
 * Owner broadcast to a specific segment (list of LINE user IDs).
 */
async function broadcastToSegment(lineUserIds, messageText) {
  const message = { type: 'text', text: messageText };
  return safe(multicastMessage(lineUserIds, message), 'broadcastToSegment');
}

module.exports = {
  notifyStampAdded,
  notifyRewardEarned,
  notifyCouponIssued,
  notifyCouponIssuedBulk,
  broadcastToAllFollowers,
  broadcastToSegment,
};