// services/chatbot/keywordReplies.js
// Database-driven auto-reply system. Keyword lookups come from the
// `chat_keywords` table instead of a hardcoded list. Adding, editing,
// or disabling a keyword is now a data change (chat_keywords row),
// not a code change - no other file needs to change.
//
// Flow: message -> matchKeyword() -> chat_keywords -> response_type
//   -> response_target -> settings (for 'knowledge') -> reply
//
// Flex builders are preserved (imported from ../line/flexMessage)
// for use by the upcoming STEP 4 dynamic response_type handlers.

const {
  buildMainMenuFlex,
  buildStoreInfoFlex,
  buildHelpMenuFlex,
  buildCouponFlex,
  buildStampProgressFlex,
  buildQuickReply,
} = require('../line/flexMessage');
const { query } = require('../../database/db');
const knowledgeService = require('../knowledge/knowledgeService');
const { getProfile } = require('../membership/profileService');
const { listMemberCoupons } = require('../coupon/couponService');
const { listPromotions } = require('../coupon/promotionService');
const config = require('../../config');

// STEP 6 - Alias Mapping: map common user variations to canonical keyword targets
const ALIAS_MAP = {
  'ร้านเปิดกี่โมง': 'opening hours',
  'เปิดกี่โมง': 'opening hours',
  'เวลาเปิด': 'opening hours',
  'โปรโมชั่น': 'latest promotions',
  'โปร': 'latest promotions',
  'คูปอง': 'member_coupons',
  'แต้ม': 'member_points',
  'คะแนน': 'member_points',
  'สมาชิก': 'member_card',
  'แสตมป์': 'member_stamps',
};

/**
 * Handles dynamic response targets.
 * @param {string} target - response target (e.g., 'member_card', 'member_points')
 * @param {object|null} member - authenticated member object
 * @returns {Promise<object|object[]>} message(s) to reply with
 */
async function handleDynamicResponse(target, member) {
  // Member-specific targets require authentication
  const memberTargets = ['member_card', 'member_points', 'member_stamps', 'member_coupons'];
  if (memberTargets.includes(target) && !member) {
    return {
      type: 'text',
      text: 'Please open the Grandfa Cafe menu below and tap "My Member Card" to log in first.',
    };
  }

  switch (target) {
    case 'member_card': {
      const profile = await getProfile(member.id);
      const availableRewards = Math.floor((profile.total_stamps_earned || 0) / (config.loyalty.stampsRequiredForReward || 10));
      return {
        type: 'flex',
        altText: 'Your Digital Member Card',
        contents: {
          type: 'bubble',
          header: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '👤 Digital Member Card',
                weight: 'bold',
                size: 'lg',
                align: 'start',
              },
            ],
          },
          body: {
            type: 'box',
            layout: 'vertical',
            spacing: 'md',
            contents: [
              {
                type: 'text',
                text: profile.display_name || 'Member',
                weight: 'bold',
                size: 'xl',
              },
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  { type: 'text', text: 'Points', color: '#666666', size: 'sm', flex: 0 },
                  { type: 'text', text: String(profile.points || 0), weight: 'bold', size: 'sm', align: 'end' },
                ],
              },
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  { type: 'text', text: 'Stamps', color: '#666666', size: 'sm', flex: 0 },
                  { type: 'text', text: String(profile.current_stamps || 0), weight: 'bold', size: 'sm', align: 'end' },
                ],
              },
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  { type: 'text', text: 'Available rewards', color: '#666666', size: 'sm', flex: 0 },
                  { type: 'text', text: String(availableRewards), weight: 'bold', size: 'sm', align: 'end' },
                ],
              },
            ],
          },
          footer: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'button',
                style: 'primary',
                action: {
                  type: 'uri',
                  label: 'View Member Card',
                  uri: 'https://grandfa-farm-cafe.onrender.com/liff/member',
                },
              },
            ],
          },
        },
      };
    }

    case 'member_points': {
      const profile = await getProfile(member.id);
      return {
        type: 'text',
        text: `💰 Your current points: ${profile.points}`,
      };
    }

    case 'member_stamps': {
      return buildStampProgressFlex(member, config.loyalty.stampsRequiredForReward);
    }

    case 'member_coupons': {
      const coupons = await listMemberCoupons(member.id, 'unused');
      if (coupons.length === 0) {
        return {
          type: 'text',
          text: 'You have no active coupons right now. Keep collecting stamps!',
        };
      }
      return coupons.slice(0, 5).map((c) => buildCouponFlex(c));
    }

    case 'latest_promotions': {
      const promotions = await listPromotions();
      const activePromos = promotions.filter((p) => p.is_active);
      if (activePromos.length === 0) {
        return {
          type: 'text',
          text: 'No active promotions at the moment. Check back soon!',
        };
      }
      return {
        type: 'text',
        text: `🎉 ${activePromos.length} active promotion(s):\n${activePromos.map((p) => `• ${p.title}`).join('\n')}`,
      };
    }

    default:
      return null;
  }
}

/**
 * Logs keyword matching attempts and results for debugging and analytics.
 * @param {string} rawText - original user input
 * @param {string|null} normalizedText - normalized text or null
 * @param {string} matchStrategy - 'exact' | 'alias' | 'partial' | 'none'
 * @param {string|null} matchedKeyword - the keyword that matched, or null
 * @param {string|null} responseType - response_type from matched keyword, or null
 */
function logKeywordMatch(rawText, normalizedText, matchStrategy, matchedKeyword, responseType) {
  const timestamp = new Date().toISOString();
  console.info(
    JSON.stringify({
      timestamp,
      rawText,
      normalizedText,
      matchStrategy,
      matchedKeyword,
      responseType,
    })
  );
}

/**
 * Normalizes user input for consistent keyword matching.
 * @param {string} rawText
 * @returns {string|null} normalized text or null if empty after normalization
 */
function normalizeKeyword(rawText) {
  let normalized = (rawText || '').trim().toLowerCase();

  // Collapse multiple spaces
  normalized = normalized.replace(/\s+/g, ' ');

  // Remove trailing punctuation
  normalized = normalized.replace(/[?!.,]+$/, '');

  // Remove Thai polite endings
  normalized = normalized
    .replace(/\s*ครับ\s*$/, '')
    .replace(/\s*ค่ะ\s*$/, '')
    .replace(/\s*คะ\s*$/, '')
    .replace(/\s*นะ\s*$/, '');

  // Remove English "please"
  normalized = normalized.replace(/\s*please\s*/gi, ' ').trim();

  // Collapse spaces again after removals
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized || null;
}

/**
 * Looks up a single active keyword row by exact, case-insensitive match.
 * @param {string} normalizedText - already trimmed + lowercased
 * @returns {Promise<{ keyword: string, response_text: string, response_type: string, response_target: string|null, is_active: boolean } | null>}
 */
async function findActiveKeyword(normalizedText) {
  const result = await query(
    `SELECT keyword, response_text, response_type, response_target, is_active
     FROM chat_keywords
     WHERE is_active = TRUE AND LOWER(keyword) = $1
     LIMIT 1`,
    [normalizedText]
  );
  return result.rows[0] || null;
}

/**
 * STEP 8 - Partial Matching: searches for keywords contained in the normalized text.
 * @param {string} normalizedText - already trimmed + lowercased
 * @returns {Promise<{ keyword: string, response_text: string, response_type: string, response_target: string|null, is_active: boolean } | null>}
 */
async function findPartialKeyword(normalizedText) {
  const result = await query(
    `SELECT keyword, response_text, response_type, response_target, is_active
     FROM chat_keywords
     WHERE is_active = TRUE AND LOWER($1) LIKE '%' || LOWER(keyword) || '%'
     LIMIT 1`,
    [normalizedText]
  );
  return result.rows[0] || null;
}

/**
 * @param {string} rawText
 * @param {object|null} member
 * @returns {Promise<object|object[]|null>} message(s) to reply with, or null if no keyword matched
 */
async function matchKeyword(rawText, member) {
  const normalized = normalizeKeyword(rawText);
  if (!normalized) {
    logKeywordMatch(rawText, null, 'none', null, null);
    return null;
  }

  // STEP 7 - Priority Matching:
  // 1. Try exact keyword match
  let row = await findActiveKeyword(normalized);
  let strategy = 'exact';

  // 2. If not found, try alias mapping
  if (!row) {
    const aliasTarget = ALIAS_MAP[normalized];
    if (aliasTarget) {
      row = await findActiveKeyword(aliasTarget);
      strategy = 'alias';
    }
  }

  // 3. If not found, try partial match
  if (!row) {
    row = await findPartialKeyword(normalized);
    strategy = 'partial';
  }

  // 4. No match
  if (!row) {
    logKeywordMatch(rawText, normalized, 'none', null, null);
    return null;
  }

  switch (row.response_type) {
    case 'text': {
      logKeywordMatch(rawText, normalized, strategy, row.keyword, row.response_type);
      return { type: 'text', text: row.response_text };
    }

    case 'knowledge': {
      const entry = await knowledgeService.get(row.response_target);
      if (!entry) {
        logKeywordMatch(rawText, normalized, strategy, row.keyword, row.response_type);
        return { type: 'text', text: 'Information is currently unavailable.' };
      }
      logKeywordMatch(rawText, normalized, strategy, row.keyword, row.response_type);
      return { type: 'text', text: entry.value.content };
    }

    case 'dynamic': {
      logKeywordMatch(rawText, normalized, strategy, row.keyword, row.response_type);
      return handleDynamicResponse(row.response_target, member);
    }

    default: {
      logKeywordMatch(rawText, normalized, strategy, row.keyword, row.response_type);
      return null;
    }
  }
}

module.exports = { matchKeyword, buildMainMenuFlex, handleDynamicResponse, normalizeKeyword, logKeywordMatch };
