// services/membership/memberCardService.js
// Generates the permanent Member QR code. The QR encodes ONLY a
// signed token wrapping member_uid - never points, coupons, or any
// personal data (see utils/qrToken.js for the security rationale).

const QRCode = require('qrcode');
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
  return {
    displayName: member.display_name,
    pictureUrl: member.picture_url,
    memberUid: member.member_uid,
    currentStamps: member.current_stamps,
    points: member.points,
    memberSince: member.created_at,
    qrCode: qrDataUrl,
  };
}

module.exports = { generateMemberQrDataUrl, buildMemberCard };