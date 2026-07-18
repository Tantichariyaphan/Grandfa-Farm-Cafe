const express = require('express');
const { createLineWebhookMiddleware } = require('../services/line/lineClient');
const { processWebhookEvents } = require('../services/chatbot/webhookHandler');
const { webhookLimiter } = require('../middleware/rateLimiter');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();
router.post('/', webhookLimiter, createLineWebhookMiddleware(), asyncHandler(async (req, res) => {
  await processWebhookEvents(req.body.events || []);
  res.status(200).end();
}));
module.exports = router;
