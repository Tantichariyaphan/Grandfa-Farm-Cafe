// services/line/broadcast.js
// Sends a message to every follower of the LINE Official Account.
// Used by the Owner Dashboard's "Broadcast" feature.

const { client } = require('./lineClient');

/**
 * @param {object|object[]} messages
 */
async function broadcastMessage(messages) {
  const messageArray = Array.isArray(messages) ? messages : [messages];
  return client.broadcast({ messages: messageArray });
}

module.exports = { broadcastMessage };