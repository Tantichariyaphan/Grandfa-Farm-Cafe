// utils/jwt.js
// Signs and verifies session tokens for two audiences: LIFF customers
// and staff/owner dashboard logins. Kept separate (different "aud")
// so a member token can never be used to access staff endpoints.

const jwt = require('jsonwebtoken');
const config = require('../config');

function signMemberToken(member) {
  return jwt.sign(
    { sub: member.id, memberUid: member.member_uid, aud: 'member' },
    config.auth.jwtSecret,
    { expiresIn: config.auth.jwtExpiresIn }
  );
}

function signStaffToken(staff) {
  return jwt.sign(
    { sub: staff.id, role: staff.role, aud: 'staff' },
    config.auth.jwtSecret,
    { expiresIn: config.auth.staffJwtExpiresIn }
  );
}

function verifyToken(token) {
  return jwt.verify(token, config.auth.jwtSecret);
}

module.exports = { signMemberToken, signStaffToken, verifyToken };