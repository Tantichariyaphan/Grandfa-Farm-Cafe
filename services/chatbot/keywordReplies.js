// services/chatbot/keywordReplies.js
// Declarative keyword -> handler map for the auto-reply system.
// To add a new keyword, add one entry here - no other file needs to
// change. Each handler receives (member, context) and returns a LINE
// message object or array of message objects.

const {
  buildMainMenuFlex,
  buildStoreInfoFlex,
  buildHelpMenuFlex,
  buildCouponFlex,
  buildStampProgressFlex,
  buildQuickReply,
} = require('../line/flexMessage');
const { query } = require('../../database/db');
const { listMemberCoupons } = require('../coupon/couponService');
const config = require('../../config');

async function getSettingsMap() {
  const result = await query(`SELECT key, value FROM settings`);
  const map = {};
  for (const row of result.rows) {
    map[row.key] = row.value;
  }
  return map;
}

const KEYWORD_HANDLERS = [
  {
    keywords: ['menu', 'help', 'member menu'],
    handle: async () => buildHelpMenuFlex(),
  },
  {
    keywords: ['membership', 'member card', 'my card', 'stamps', 'stamp'],
    handle: async (member) => {
      if (!member) return textWithLoginPrompt();
      return buildStampProgressFlex(member, config.loyalty.stampsRequiredForReward);
    },
  },
  {
    keywords: ['coupons', 'coupon', 'my coupons'],
    handle: async (member) => {
      if (!member) return textWithLoginPrompt();
      const coupons = await listMemberCoupons(member.id, 'unused');
      if (coupons.length === 0) {
        return { type: 'text', text: 'You have no active coupons right now. Keep collecting stamps!' };
      }
      return coupons.slice(0, 5).map((c) => buildCouponFlex(c));
    },
  },
  {
    keywords: ['store info', 'store information', 'info'],
    handle: async () => buildStoreInfoFlex(await getSettingsMap()),
  },
  {
    keywords: ['business hours', 'hours', 'opening hours'],
    handle: async () => {
      const settings = await getSettingsMap();
      return { type: 'text', text: `🕒 Business Hours: ${settings.business_hours?.value || 'Not set'}` };
    },
  },
  {
    keywords: ['location', 'address', 'where'],
    handle: async () => {
      const settings = await getSettingsMap();
      return { type: 'text', text: `📍 ${settings.location?.value || 'Not set'}` };
    },
  },
  {
    keywords: ['contact', 'contact us', 'phone'],
    handle: async () => {
      const settings = await getSettingsMap();
      return { type: 'text', text: `📞 Contact us: ${settings.contact_phone?.value || 'Not set'}` };
    },
  },
  {
    keywords: ['promotion', 'promotions', 'deals'],
    handle: async () => ({
      type: 'text',
      text: 'Check back here for our latest promotions, or open the app to see your personal coupons!',
      quickReply: buildQuickReply([
        { label: 'My Coupons', text: 'coupons' },
        { label: 'Store Info', text: 'store info' },
      ]),
    }),
  },
];

function textWithLoginPrompt() {
  return {
    type: 'text',
    text: 'Please open the Grandfa Cafe menu below and tap "My Member Card" to log in first.',
  };
}

/**
 * Normalize raw user input for keyword matching.
 * @param {string} rawText
 * @returns {string} normalized text (trimmed, lowercase)
 */
function normalizeKeyword(rawText) {
  return (rawText || '').trim().toLowerCase();
}

/**
 * Find an active keyword from the database with alias mapping support.
 * Applies alias mapping before database lookup.
 * @param {string} normalizedKeyword
 * @returns {Promise<object|null>} keyword row from database, or null if not found
 */
async function findActiveKeyword(normalizedKeyword) {
  if (!normalizedKeyword) return null;

  // Alias mapping: map normalizedKeyword to canonical form if alias exists
  const aliasMap = {
    'help': 'menu',
    'member menu': 'menu',
    'member card': 'membership',
    'my card': 'membership',
    'stamp': 'stamps',
    'coupon': 'coupons',
    'my coupons': 'coupons',
    'store information': 'store info',
    'info': 'store info',
    'hours': 'business hours',
    'opening hours': 'business hours',
    'address': 'location',
    'where': 'location',
    'contact us': 'contact',
    'phone': 'contact',
    'deals': 'promotion',
  };

  const canonicalKeyword = aliasMap[normalizedKeyword] || normalizedKeyword;

  const result = await query(
    `SELECT * FROM chat_keywords WHERE keyword = $1 AND is_active = true LIMIT 1`,
    [canonicalKeyword]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * @param {string} rawText
 * @param {object|null} member
 * @returns {Promise<object|object[]|null>} message(s) to reply with, or null if no keyword matched
 */
async function matchKeyword(rawText, member) {
  const normalized = (rawText || '').trim().toLowerCase();
  for (const entry of KEYWORD_HANDLERS) {
    if (entry.keywords.includes(normalized)) {
      return entry.handle(member);
    }
  }
  return null;
}

module.exports = { matchKeyword, buildMainMenuFlex, normalizeKeyword, findActiveKeyword };