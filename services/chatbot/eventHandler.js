// services/chatbot/eventHandler.js
// Handles each LINE webhook event type. Text/postback replies use the
// replyToken (fast, free); anything requiring extra async work still
// completes within LINE's ~30s reply window since our DB calls are fast.

const { client } = require('../line/lineClient');
const { replyMessage } = require('../line/reply');
const { showLoadingAnimation } = require('../line/loadingAnimation');
const { findOrCreateMember } = require('../membership/registerService');
const { query } = require('../../database/db');
const { matchKeyword, buildMainMenuFlex } = require('./keywordReplies');
const { resolveCouponFromToken } = require('../coupon/couponService');
const { buildCouponFlex } = require('../line/flexMessage');

async function getMemberByLineUserId(lineUserId) {
  const result = await query(
    `SELECT id, member_uid, line_user_id, display_name, picture_url,
            current_stamps, total_stamps_earned, points, is_active
     FROM members WHERE line_user_id = $1`,
    [lineUserId]
  );
  return result.rows[0] || null;
}

/**
 * A user followed (added) the Official Account. We auto-register them
 * as a member immediately using their public LINE profile, so they
 * already have a member card before they ever open the LIFF app.
 */
async function handleFollowEvent(event) {
  const lineUserId = event.source.userId;
  if (!lineUserId) return;

  let profile;
  try {
    profile = await client.getProfile(lineUserId);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to fetch profile on follow:', err.message);
    profile = { displayName: 'Grandfa Cafe Member', pictureUrl: null };
  }

  await findOrCreateMember({
    userId: lineUserId,
    displayName: profile.displayName,
    pictureUrl: profile.pictureUrl,
  });

  await replyMessage(event.replyToken, [
    { type: 'text', text: `Welcome to Grandfa Cafe, ${profile.displayName}! 🎉` },
    buildMainMenuFlex(),
  ]);
}

/**
 * A user unfollowed (blocked) the Official Account. We do not
 * deactivate their membership - they may still visit the cafe and use
 * the LIFF app. We simply log it for the owner's awareness.
 */
async function handleUnfollowEvent(event) {
  // eslint-disable-next-line no-console
  console.log(`User unfollowed: ${event.source.userId}`);
}

/**
 * Text messages: try the keyword system first, otherwise a generic
 * fallback reply pointing to the menu.
 */
async function handleMessageEvent(event) {
  if (event.message.type !== 'text') {
    await replyMessage(event.replyToken, {
      type: 'text',
      text: 'Sorry, I can only understand text messages right now. Tap "menu" to see what I can do!',
    });
    return;
  }

  const lineUserId = event.source.userId;
  const member = lineUserId ? await getMemberByLineUserId(lineUserId) : null;

  const matched = await matchKeyword(event.message.text, member);
  if (matched) {
    await replyMessage(event.replyToken, matched);
    return;
  }

  await replyMessage(event.replyToken, {
    type: 'text',
    text: 'I didn\'t quite catch that. Type "menu" to see everything I can help with!',
  });
}

/**
 * Postback events come from Flex/rich-menu buttons using
 * action: { type: 'postback', data: '...' }. Data is a simple
 * URL-encoded query string, e.g. "action=keyword&value=coupons".
 */
async function handlePostbackEvent(event) {
  const params = new URLSearchParams(event.postback.data);
  const action = params.get('action');
  const lineUserId = event.source.userId;
  const member = lineUserId ? await getMemberByLineUserId(lineUserId) : null;

  if (action === 'keyword') {
    const value = params.get('value') || '';
    const matched = await matchKeyword(value, member);
    if (matched) {
      await replyMessage(event.replyToken, matched);
      return;
    }
  }

  if (action === 'view_coupon') {
    const code = params.get('code');
    try {
      const coupon = await resolveCouponFromToken(code);
      await replyMessage(event.replyToken, buildCouponFlex(coupon));
      return;
    } catch (err) {
      await replyMessage(event.replyToken, { type: 'text', text: 'Sorry, that coupon could not be found.' });
      return;
    }
  }

  await replyMessage(event.replyToken, buildMainMenuFlex());
}

/**
 * Top-level dispatcher used by the webhook route.
 */
async function handleEvent(event) {
  showLoadingAnimation(event.source?.userId, 5); // fire-and-forget

  switch (event.type) {
    case 'follow':
      return handleFollowEvent(event);
    case 'unfollow':
      return handleUnfollowEvent(event);
    case 'message':
      return handleMessageEvent(event);
    case 'postback':
      return handlePostbackEvent(event);
    default:
      return null;
  }
}

module.exports = { handleEvent };