// services/membership/memberCardService.js
// Generates the permanent Member QR code. The QR encodes ONLY a
// signed token wrapping member_uid - never points, coupons, or any
// personal data (see utils/qrToken.js for the security rationale).

const QRCode = require('qrcode');
const { query } = require('../../database/db');
const { signMemberToken } = require('../../utils/qrToken');

/**
 * @param {string} memberUid
 * @returns {Promise<string>} PNG data URL (data:image/png;base64,...)
 */
async function generateMemberQrDataUrl(memberUid) {
  const token = signMemberToken(memberUid);
  return QRCode.toDataURL(token, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 400,
    color: { dark: '#3E2723', light: '#FFFFFF' },
  });
}

/**
 * Builds the full "member card" view model combining profile data
 * with the rendered QR, used by GET /api/member/card.
 */
async function buildMemberCard(member) {
  const qrDataUrl = await generateMemberQrDataUrl(member.member_uid);

  const result = await query(
    `SELECT COUNT(*)::int AS count FROM coupons
     WHERE member_id = $1 AND status = 'unused' AND expires_at > NOW()`,
    [member.id]
  );

  const availableRewards = result.rows[0].count;
let membershipLevel;
let membershipName;
let membershipTagline;
let memberCardBackground;

if (member.total_stamps_earned >= 50) {
  membershipLevel = 3;
  membershipName = "Grandfa Heritage";
  membershipTagline = "A place where memories become traditions.";
  memberCardBackground = "/pic/membercard/MembercardLevel3.png";
}
else if (member.total_stamps_earned >= 20) {
  membershipLevel = 2;
  membershipName = "Grandfa Family";
  membershipTagline = "You're no longer just a guest. You're family.";
  memberCardBackground = "/pic/membercard/MembercardLevel2.png";
}
else {
  membershipLevel = 1;
  membershipName = "Grandfa Friend";
  membershipTagline = "Every great journey starts with a first visit.";
  memberCardBackground = "/pic/membercard/MembercardLevel1.png";
}
  return {
    displayName: member.display_name,
    pictureUrl: member.picture_url,
    memberUid: member.member_uid,
    currentStamps: member.current_stamps,
    points: member.points,
    memberSince: member.created_at,
    qrCode: qrDataUrl,
    availableRewards,
    membershipLevel,
    membershipName,
    membershipTagline,
    memberCardBackground,
  };
}

module.exports = { generateMemberQrDataUrl, buildMemberCard };