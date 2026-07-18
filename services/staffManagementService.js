// services/staffManagementService.js
// Owner-only management of staff/owner accounts. Passwords are always
// hashed with bcrypt before storage.

const bcrypt = require('bcryptjs');
const { query } = require('../database/db');
const AppError = require('../utils/AppError');

const SAFE_FIELDS = `id, username, display_name, role, is_active, created_at`;

async function createStaffAccount({ username, password, displayName, role = 'staff' }) {
  if (!['staff', 'owner'].includes(role)) {
    throw new AppError('Invalid role', 400);
  }

  const existing = await query(`SELECT id FROM staff WHERE username = $1`, [username]);
  if (existing.rows[0]) {
    throw new AppError('Username already exists', 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const result = await query(
    `INSERT INTO staff (username, password_hash, display_name, role)
     VALUES ($1, $2, $3, $4)
     RETURNING ${SAFE_FIELDS}`,
    [username, passwordHash, displayName, role]
  );
  return result.rows[0];
}

async function listStaffAccounts() {
  const result = await query(`SELECT ${SAFE_FIELDS} FROM staff ORDER BY created_at DESC`);
  return result.rows;
}

async function setStaffActive(staffId, isActive) {
  const result = await query(
    `UPDATE staff SET is_active = $2 WHERE id = $1 RETURNING ${SAFE_FIELDS}`,
    [staffId, isActive]
  );
  if (!result.rows[0]) {
    throw new AppError('Staff account not found', 404);
  }
  return result.rows[0];
}

async function resetStaffPassword(staffId, newPassword) {
  const passwordHash = await bcrypt.hash(newPassword, 12);
  const result = await query(
    `UPDATE staff SET password_hash = $2 WHERE id = $1 RETURNING ${SAFE_FIELDS}`,
    [staffId, passwordHash]
  );
  if (!result.rows[0]) {
    throw new AppError('Staff account not found', 404);
  }
  return result.rows[0];
}

module.exports = { createStaffAccount, listStaffAccounts, setStaffActive, resetStaffPassword };