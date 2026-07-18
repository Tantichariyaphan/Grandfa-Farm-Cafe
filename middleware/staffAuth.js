// middleware/staffAuth.js
// Authenticates staff/owner calling from the Staff LIFF app or the
// Owner dashboard. Expects: Authorization: Bearer <staff JWT>
// On success, attaches req.staff = { id, username, display_name, role }

const jwt = require('jsonwebtoken');
const { verifyToken } = require('../utils/jwt');
const { query } = require('../database/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const requireStaffAuth = asyncHandler(async (req, res, next) => {
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

  if (payload.aud !== 'staff') {
    throw new AppError('Invalid token audience', 403);
  }

  const result = await query(
    `SELECT id, username, display_name, role, is_active
     FROM staff WHERE id = $1`,
    [payload.sub]
  );

  const staff = result.rows[0];
  if (!staff) {
    throw new AppError('Staff account not found', 401);
  }
  if (!staff.is_active) {
    throw new AppError('This account has been deactivated', 403);
  }

  req.staff = staff;
  return next();
});

module.exports = requireStaffAuth;