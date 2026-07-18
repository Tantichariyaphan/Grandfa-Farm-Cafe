// services/line/multicast.js
// Sends the same message to a specific list of LINE user IDs in one
// call (e.g. "all members with a birthday this week"). LINE's API
// caps multicast at 500 recipients per call, so we chunk automatically.

const { client } = require('./lineClient');

const MAX_RECIPIENTS_PER_CALL = 500;

function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * @param {string[]} lineUserIds
 * @param {object|object[]} messages
 */
async function multicastMessage(lineUserIds, messages) {
  const messageArray = Array.isArray(messages) ? messages : [messages];
  const batches = chunk(lineUserIds, MAX_RECIPIENTS_PER_CALL);

  const results = [];
  for (const batch of batches) {
    if (batch.length === 0) continue;
    // eslint-disable-next-line no-await-in-loop
    const result = await client.multicast({ to: batch, messages: messageArray });
    results.push(result);
  }
  return results;
}

module.exports = { multicastMessage };