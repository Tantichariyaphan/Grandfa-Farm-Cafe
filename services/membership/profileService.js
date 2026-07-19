// services/membership/profileService.js
// Read and limited update of a member's own profile. Only contact
// fields (phone, birthday) are editable by the customer - loyalty
// data (stamps, points) is never writable through this service.

const { query } = require('../../database/db');
const AppError = require('../../utils/AppError');

const PROFILE_FIELDS = `id, member_uid, line_user_id, display_name, picture_url, phone,
  birthday, current_stamps, total_stamps_earned, points, is_active, created_at`;

async function getProfile(memberId) {
  const result = await query(`SELECT ${PROFILE_FIELDS} FROM members WHERE id = $1`, [memberId]);
  if (!result.rows[0]) {
    throw new AppError('Member not found', 404);
  }
  return result.rows[0];
}

/**
 * @param {number} memberId
 * @param {{ phone?: string, birthday?: string }} updates
 */
async function updateProfile(memberId, updates) {
  const phone = updates.phone?.trim() || null;
  const birthday = updates.birthday?.trim() || null;

  const result = await query(
    `UPDATE members
     SET phone = COALESCE($2, phone),
         birthday = COALESCE($3, birthday)
     WHERE id = $1
     RETURNING ${PROFILE_FIELDS}`,
    [memberId, phone, birthday]
  );

  if (!result.rows[0]) {
    throw new AppError('Member not found', 404);
  }
  return result.rows[0];
}

module.exports = { getProfile, updateProfile };