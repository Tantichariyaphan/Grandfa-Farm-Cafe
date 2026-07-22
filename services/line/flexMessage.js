// services/line/flexMessage.js
// Pure builder functions that return LINE Flex Message objects.
// No network calls here - these are passed into reply/push/multicast.

const config = require('../../config');

function liffMemberUrl(path = '') {
  return `https://liff.line.me/${config.liff.memberId}${path}`;
}

/**
 * Main member menu shown for the "member menu" / "help" keyword.
 */
function buildMainMenuFlex() {
  return {
    type: 'flex',
    altText: 'Grandfa Cafe Menu',
    contents: {
      type: 'bubble',
      hero: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: '☕ Grandfa Cafe', weight: 'bold', size: 'xl', align: 'center' },
        ],
        paddingAll: '20px',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          { type: 'text', text: 'Welcome! What would you like to do?', wrap: true, size: 'sm', color: '#666666' },
          {
            type: 'button',
            style: 'primary',
            color: '#5B3A29',
            action: { type: 'uri', label: 'My Member Card', uri: liffMemberUrl('') },
          },
          {
            type: 'button',
            style: 'secondary',
            action: { type: 'uri', label: 'My Coupons', uri: liffMemberUrl('/coupons') },
          },
          {
            type: 'button',
            style: 'secondary',
            action: { type: 'message', label: 'Store Info', text: 'store info' },
          },
          {
            type: 'button',
            style: 'secondary',
            action: { type: 'message', label: 'Contact Us', text: 'contact' },
          },
        ],
      },
    },
  };
}

/**
 * Shows current stamp progress and points.
 */
function buildStampProgressFlex(member, stampsRequired) {
  const progress = Math.min(member.current_stamps / stampsRequired, 1);
  const progressPercent = Math.round(progress * 100);

  return {
    type: 'flex',
    altText: `You have ${member.current_stamps} stamps`,
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          { type: 'text', text: 'Your Stamp Card', weight: 'bold', size: 'lg' },
          { type: 'text', text: `${member.current_stamps} / ${stampsRequired} stamps`, size: 'xl', color: '#5B3A29', weight: 'bold' },
          {
            type: 'box',
            layout: 'vertical',
            height: '10px',
            backgroundColor: '#EEEEEE',
            cornerRadius: '5px',
            contents: [
              {
                type: 'box',
                layout: 'vertical',
                width: `${progressPercent}%`,
                height: '10px',
                backgroundColor: '#5B3A29',
                cornerRadius: '5px',
                contents: [],
              },
            ],
          },
          { type: 'text', text: `${Math.max(stampsRequired - member.current_stamps, 0)} more drinks for a free coupon!`, size: 'xs', color: '#999999', wrap: true },
        ],
      },
    },
  };
}

/**
 * Reward / promotion coupon card, used by notifications and the
 * chatbot "coupons" keyword.
 */
function buildCouponFlex(coupon) {
  const expiresLabel = new Date(coupon.expires_at).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  return {
    type: 'flex',
    altText: coupon.title,
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          { type: 'text', text: '🎉 ' + coupon.title, weight: 'bold', size: 'lg', wrap: true },
          { type: 'text', text: coupon.description || 'Show this in the app to redeem in-store.', size: 'sm', color: '#666666', wrap: true },
          { type: 'text', text: `Code: ${coupon.code}`, size: 'xs', color: '#999999' },
          { type: 'text', text: `Expires: ${expiresLabel}`, size: 'xs', color: '#999999' },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#5B3A29',
            action: { type: 'uri', label: 'View & Redeem', uri: liffMemberUrl('?liff.state=%2Fcoupons') },
          },
        ],
      },
    },
  };
}

/**
 * Store information card (hours, location, contact) used by the
 * chatbot's "Store Information" keyword.
 */
function buildStoreInfoFlex(settingsMap) {
  return {
    type: 'flex',
    altText: 'Store Information',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          { type: 'text', text: settingsMap.store_name?.value || 'Grandfa Cafe', weight: 'bold', size: 'lg' },
          { type: 'text', text: '🕒 ' + (settingsMap.business_hours?.value || '-'), size: 'sm', wrap: true },
          { type: 'text', text: '📍 ' + (settingsMap.location?.value || '-'), size: 'sm', wrap: true },
          { type: 'text', text: '📞 ' + (settingsMap.contact_phone?.value || '-'), size: 'sm', wrap: true },
        ],
      },
    },
  };
}

/**
 * Simple help menu with quick-reply-style buttons.
 */
function buildHelpMenuFlex() {
  return {
    type: 'flex',
    altText: 'Help Menu',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          { type: 'text', text: 'How can we help?', weight: 'bold', size: 'lg' },
          { type: 'button', style: 'secondary', action: { type: 'message', label: 'Membership', text: 'membership' } },
          { type: 'button', style: 'secondary', action: { type: 'message', label: 'Coupons', text: 'coupons' } },
          { type: 'button', style: 'secondary', action: { type: 'message', label: 'Store Info', text: 'store info' } },
          { type: 'button', style: 'secondary', action: { type: 'message', label: 'Contact', text: 'contact' } },
        ],
      },
    },
  };
}

/**
 * Quick reply items attached to a text message for fast follow-ups.
 */
function buildQuickReply(items) {
  return {
    items: items.map((item) => ({
      type: 'action',
      action: { type: 'message', label: item.label, text: item.text },
    })),
  };
}

module.exports = {
  buildMainMenuFlex,
  buildStampProgressFlex,
  buildCouponFlex,
  buildStoreInfoFlex,
  buildHelpMenuFlex,
  buildQuickReply,
};
