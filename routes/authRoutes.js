// routes/authRoutes.js
// POST /api/auth/line-login  - customer login via LIFF ID token
// POST /api/auth/staff-login - staff/owner username+password login

const express = require('express');
const { body } = require('express-validator');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const { ok } = require('../utils/response');
const { loginWithLine } = require('../services/membership/lineAuthService');
const { loginStaff } = require('../services/membership/staffAuthService');
const requireMemberAuth = require('../middleware/auth');
const requireStaffAuth = require('../middleware/staffAuth');

const router = express.Router();

router.post(
  '/line-login',
  authLimiter,
  validate([body('idToken').isString().notEmpty().withMessage('idToken is required')]),
  asyncHandler(async (req, res) => {
    const { idToken } = req.body;
    const { member, token, isNewMember } = await loginWithLine(idToken);
    return ok(res, { member, token, isNewMember }, 'Login successful');
  })
);

router.get('/session', requireMemberAuth, asyncHandler(async (req, res) => ok(res, { member: req.member }, 'Session valid')));
router.get('/staff-session', requireStaffAuth, asyncHandler(async (req, res) => ok(res, { staff: req.staff }, 'Session valid')));

router.post(
  '/staff-login',
  authLimiter,
  validate([
    body('username').isString().notEmpty().withMessage('username is required'),
    body('password').isString().notEmpty().withMessage('password is required'),
  ]),
  asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    const { staff, token } = await loginStaff(username, password);
    return ok(res, { staff, token }, 'Login successful');
  })
);

module.exports = router;
