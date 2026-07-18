// middleware/rateLimiter.js
// General-purpose limiter for all API traffic, plus a stricter limiter
// for authentication endpoints to slow down brute-force / credential
// stuffing attempts. No Redis - in-memory store is fine for a single
// Render service instance.

const rateLimit = require('express-rate-limit');
const config = require('../config');
const { fail } = require('../utils/response');

const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => fail(res, 429, 'Too many requests. Please try again later.'),
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => fail(res, 429, 'Too many login attempts. Please try again later.'),
});

const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300, // LINE platform can burst-send events
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => fail(res, 429, 'Too many requests.'),
});

module.exports = { apiLimiter, authLimiter, webhookLimiter };