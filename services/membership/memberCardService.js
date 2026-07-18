const QRCode = require('qrcode');
const { signMemberToken } = require('../../utils/qrToken');

async function buildMemberCard(member) {
  const qrToken = signMemberToken(member.member_uid);
  const qrCode = await QRCode.toDataURL(qrToken, {
    errorCorrectionLevel: 'M', margin: 2, width: 480,
    color: { dark: '#3E2723', light: '#FFFFFF' },
  });
  return {
    member: {
      memberUid: member.member_uid, displayName: member.display_name,
      pictureUrl: member.picture_url, currentStamps: member.current_stamps,
      totalStampsEarned: member.total_stamps_earned,
    },
    qrCode,
  };
}

module.exports = { buildMemberCard };
