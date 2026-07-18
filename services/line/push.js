// services/line/push.js
// Sends a message to a single LINE user outside of a reply context.
// Used for stamp confirmations, reward notifications, coupon alerts.

const { client } = require('./lineClient');

/**
 * @param {string} lineUserId
 * @param {object|object[]} messages
 */
async function pushMessage(lineUserId, messages) {
  const messageArray = Array.isArray(messages) ? messages : [messages];
  return client.pushMessage({ to: lineUserId, messages: messageArray });
}

module.exports = { pushMessage };