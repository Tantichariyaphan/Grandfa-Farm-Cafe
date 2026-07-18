// services/staffAuthService.js
// Handles staff/owner username+password login. Passwords are always
// stored as bcrypt hashes (see database/seed.js and staff management
// routes) - never plaintext, never reversible.

const bcrypt = require('bcryptjs');
const { query } = require('../../database/db');
const AppError = require('../../utils/AppError');
const { signStaffToken } = require('../../utils/jwt');

/**
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{ staff: object, token: string }>}
 */
async function loginStaff(username, password) {
  if (!username || !password) {
    throw new AppError('Username and password are required', 400);
  }

  const result = await query(
    `SELECT id, username, password_hash, display_name, role, is_active
     FROM staff WHERE username = $1`,
    [username]
  );

  const staff = result.rows[0];

  // Use a constant-shape error message so we never reveal whether the
  // username exists (avoids user enumeration).
  const invalidCredentialsError = new AppError('Invalid username or password', 401);

  if (!staff) {
    // Still run a bcrypt compare against a dummy hash to keep response
    // timing consistent whether or not the username exists.
    await bcrypt.compare(password, '$2a$12$C6UzMDM.H6dfI/f/IKcEeOWSQKlXHwF6H0.MP5f7HzHY8Wnv/9k8O');
    throw invalidCredentialsError;
  }

  if (!staff.is_active) {
    throw new AppError('This account has been deactivated', 403);
  }

  const passwordMatches = await bcrypt.compare(password, staff.password_hash);
  if (!passwordMatches) {
    throw invalidCredentialsError;
  }

  const token = signStaffToken(staff);
  const { password_hash, ...safeStaff } = staff;

  return { staff: safeStaff, token };
}

module.exports = { loginStaff };
