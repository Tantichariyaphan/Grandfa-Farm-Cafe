// middleware/auth.js
// Authenticates customers calling from the Member LIFF app.
// Expects: Authorization: Bearer <member JWT>
// On success, attaches req.member = { id, member_uid, ... }

const jwt = require('jsonwebtoken');
const { verifyToken } = require('../utils/jwt');
const { query } = require('../database/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const requireMemberAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new AppError('Missing or invalid Authorization header', 401);
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AppError('Session expired. Please log in again.', 401);
    }
    throw new AppError('Invalid session token', 401);
  }

  if (payload.aud !== 'member') {
    throw new AppError('Invalid token audience', 403);
  }

  const result = await query(
    `SELECT id, member_uid, line_user_id, display_name, picture_url, phone,
            birthday, current_stamps, total_stamps_earned, points, is_active
     FROM members WHERE id = $1`,
    [payload.sub]
  );

  const member = result.rows[0];
  if (!member) {
    throw new AppError('Member not found', 401);
  }
  if (!member.is_active) {
    throw new AppError('This account has been deactivated', 403);
  }

  req.member = member;
  return next();
});

module.exports = requireMemberAuth;