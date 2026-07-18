// services/membership/registerService.js
// Finds an existing member by LINE user id, or creates a new one.
// This is the single place a member row is ever created, so every
// new member reliably starts with a "welcome" flow if desired later.

const { query } = require('../../database/db');

/**
 * @param {{ userId: string, displayName: string, pictureUrl?: string }} lineProfile
 * @returns {Promise<{ member: object, isNewMember: boolean }>}
 */
async function findOrCreateMember(lineProfile) {
  const existing = await query(
    `SELECT id, member_uid, line_user_id, display_name, picture_url, phone,
            birthday, current_stamps, total_stamps_earned, points, is_active, created_at
     FROM members WHERE line_user_id = $1`,
    [lineProfile.userId]
  );

  if (existing.rows[0]) {
    // Keep display name / picture in sync with LINE profile on every login.
    const updated = await query(
      `UPDATE members
       SET display_name = $2, picture_url = $3
       WHERE id = $1
       RETURNING id, member_uid, line_user_id, display_name, picture_url, phone,
                 birthday, current_stamps, total_stamps_earned, points, is_active, created_at`,
      [existing.rows[0].id, lineProfile.displayName, lineProfile.pictureUrl || null]
    );
    return { member: updated.rows[0], isNewMember: false };
  }

  const created = await query(
    `INSERT INTO members (line_user_id, display_name, picture_url)
     VALUES ($1, $2, $3)
     RETURNING id, member_uid, line_user_id, display_name, picture_url, phone,
               birthday, current_stamps, total_stamps_earned, points, is_active, created_at`,
    [lineProfile.userId, lineProfile.displayName, lineProfile.pictureUrl || null]
  );

  return { member: created.rows[0], isNewMember: true };
}

module.exports = { findOrCreateMember };