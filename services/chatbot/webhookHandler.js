// services/chatbot/webhookHandler.js
// Processes the batch of events LINE sends per webhook POST. Each
// event is handled independently and errors are isolated per-event,
// so one failure never prevents the others (or the 200 OK response
// LINE requires) from completing.

const { handleEvent } = require('./eventHandler');

async function processWebhookEvents(events = []) {
  const results = await Promise.allSettled(events.map((event) => handleEvent(event)));

  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      // eslint-disable-next-line no-console
      console.error(`Webhook event ${index} failed:`, result.reason?.message || result.reason);
    }
  });
}

module.exports = { processWebhookEvents };