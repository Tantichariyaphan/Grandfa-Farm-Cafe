const crypto = require('crypto');
const { query } = require('../../database/db');

function createMemberUid() {
  return `GC${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
}

async function findOrCreateMember({ userId, displayName, pictureUrl = null }) {
  const result = await query(
    `INSERT INTO members (member_uid, line_user_id, display_name, picture_url, line_followed_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (line_user_id) DO UPDATE SET
       display_name = EXCLUDED.display_name,
       picture_url = COALESCE(EXCLUDED.picture_url, members.picture_url),
       line_followed_at = NOW(), line_unfollowed_at = NULL
     RETURNING id, member_uid, line_user_id, display_name, picture_url, phone, birthday,
       current_stamps, total_stamps_earned, points, is_active, created_at, (xmax = 0) AS inserted`,
    [createMemberUid(), userId, displayName, pictureUrl]
  );
  const { inserted, ...member } = result.rows[0];
  return { member, isNewMember: inserted };
}

module.exports = { findOrCreateMember };
