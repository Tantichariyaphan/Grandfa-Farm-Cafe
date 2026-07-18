// services/line/reply.js
// Used by the chatbot to respond to an incoming webhook event.
// A replyToken is single-use and expires quickly, so this must be
// called synchronously within the webhook handler.

const { client } = require('./lineClient');

/**
 * @param {string} replyToken
 * @param {object|object[]} messages - one message object or an array (max 5)
 */
async function replyMessage(replyToken, messages) {
  const messageArray = Array.isArray(messages) ? messages : [messages];
  return client.replyMessage({ replyToken, messages: messageArray });
}

module.exports = { replyMessage };