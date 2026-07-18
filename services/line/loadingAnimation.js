// services/line/loadingAnimation.js
// Shows the chat "..." loading indicator on the user's device while
// the webhook handler does DB work before it can reply/push. Fails
// silently since this is a UX nicety, not critical functionality.

const { client } = require('./lineClient');

/**
 * @param {string} lineUserId
 * @param {number} seconds - 5 to 60, rounded down to nearest multiple of 5
 */
async function showLoadingAnimation(lineUserId, seconds = 5) {
  try {
    const loadingSeconds = Math.max(5, Math.min(60, Math.floor(seconds / 5) * 5));
    await client.showLoadingAnimation({ chatId: lineUserId, loadingSeconds });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('showLoadingAnimation failed (non-fatal):', err.message);
  }
}

module.exports = { showLoadingAnimation };