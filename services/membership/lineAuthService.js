// services/membership/lineAuthService.js
// Verifies the ID token issued by liff.getIDToken() on the client
// against LINE's own verification endpoint. We NEVER trust a profile
// object sent directly from the client - only what LINE itself confirms.

const config = require('../../config');
const AppError = require('../../utils/AppError');
const { findOrCreateMember } = require('./registerService');
const { signMemberToken } = require('../../utils/jwt');
const { generateCoupon } = require('../coupon/couponService');
const { notifyCouponIssued } = require('../notification/notificationService');

const LINE_VERIFY_URL = 'https://api.line.me/oauth2/v2.1/verify';

/**
 * Calls LINE's token verification endpoint. Throws if the token is
 * invalid, expired, or was not issued for our LIFF channel.
 * @param {string} idToken
 * @returns {Promise<{ sub: string, name: string, picture?: string }>}
 */
async function verifyLineIdToken(idToken) {
  if (!idToken || typeof idToken !== 'string') {
    throw new AppError('Missing LINE ID token', 400);
  }

  const params = new URLSearchParams({
    id_token: idToken,
    client_id: config.line.login.channelId,
  });

  let response;
  try {
    response = await fetch(LINE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
  } catch (err) {
    throw new AppError('Unable to reach LINE verification service', 502);
  }

  if (!response.ok) {
    throw new AppError('Invalid or expired LINE login session', 401);
  }

  const payload = await response.json();

  if (payload.aud !== config.line.login.channelId) {
    throw new AppError('ID token was not issued for this app', 401);
  }

  return { sub: payload.sub, name: payload.name, picture: payload.picture };
}

/**
 * Full login flow: verify ID token -> find or create member -> issue JWT.
 * @param {string} idToken
 * @returns {Promise<{ member: object, token: string, isNewMember: boolean }>}
 */
async function loginWithLine(idToken) {
  const profile = await verifyLineIdToken(idToken);

  const { member, isNewMember } = await findOrCreateMember({
    userId: profile.sub,
    displayName: profile.name || 'Grandfa Cafe Member',
    pictureUrl: profile.picture,
  });

  if (!member.is_active) {
    throw new AppError('This account has been deactivated. Please contact the cafe.', 403);
  }

  const token = signMemberToken(member);

  if (isNewMember) {
    // Best-effort: a welcome coupon failure must never block login.
    try {
      const welcomeCoupon = await generateCoupon({
        memberId: member.id,
        type: 'welcome',
        title: 'Welcome Coupon',
        description: 'Thanks for joining Grandfa Cafe! Enjoy a free drink.',
        expiryDays: 30,
      });
      await notifyCouponIssued(member, welcomeCoupon);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to issue welcome coupon:', err.message);
    }
  }

  return { member, token, isNewMember };
}

module.exports = { verifyLineIdToken, loginWithLine };