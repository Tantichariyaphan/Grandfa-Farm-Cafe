const db = require('../../database/db');
// Reuse existing LINE client used in the project. Adjust path if project exposes client elsewhere.
const lineClient = require('../../line/lineClient');

async function insertLog(type, referenceId, payload, result) {
  const sentAt = new Date();
  const sql = `INSERT INTO broadcast_logs (type, reference_id, payload, result, sent_at) VALUES (?, ?, ?, ?, ?)`;
  const params = [type, referenceId || null, JSON.stringify(payload || null), JSON.stringify(result || null), sentAt];
  try {
    await db.query(sql, params);
  } catch (err) {
    // Log DB error but do not fail the broadcast operation
    console.error('Failed to insert broadcast log', err);
  }
}

async function sendTextBroadcast(text) {
  const message = { type: 'text', text };
  const result = await lineClient.broadcast(message);
  await insertLog('text', null, message, result);
  return result;
}

async function sendPromotionBroadcast(promotionId) {
  // Fetch promotion details if needed by other parts of project; here we only send an id-based message
  const message = {
    type: 'text',
    text: `Promotion: ${promotionId}`,
  };
  const result = await lineClient.broadcast(message);
  await insertLog('promotion', promotionId, message, result);
  return result;
}

async function sendCouponBroadcast(couponId) {
  const message = {
    type: 'text',
    text: `Coupon: ${couponId}`,
  };
  const result = await lineClient.broadcast(message);
  await insertLog('coupon', couponId, message, result);
  return result;
}

async function sendFlexBroadcast(messages) {
  // messages expected to be a LINE message object or an array of messages
  const payload = messages;
  const result = await lineClient.broadcast(payload);
  await insertLog('flex', null, payload, result);
  return result;
}

module.exports = {
  sendTextBroadcast,
  sendPromotionBroadcast,
  sendCouponBroadcast,
  sendFlexBroadcast,
};
