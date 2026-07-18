// services/line/richMenu.js
// Manages the LINE Official Account Rich Menu: create, upload image,
// set as default for all users, and link a specific menu to one user
// (e.g. showing a different rich menu to staff vs customers is not
// supported by LINE per-role automatically, so staff should use the
// Staff LIFF directly rather than relying on a rich menu variant).

const { client, blobClient } = require('./lineClient');

/**
 * @param {object} richMenuObject - LINE rich menu definition (size, areas, chatBarText, etc.)
 * @returns {Promise<string>} richMenuId
 */
async function createRichMenu(richMenuObject) {
  const result = await client.createRichMenu(richMenuObject);
  return result.richMenuId;
}

/**
 * @param {string} richMenuId
 * @param {Buffer} imageBuffer
 * @param {string} contentType - 'image/png' or 'image/jpeg'
 */
async function uploadRichMenuImage(richMenuId, imageBuffer, contentType) {
  return blobClient.setRichMenuImage(richMenuId, imageBuffer, contentType);
}

async function setDefaultRichMenu(richMenuId) {
  return client.setDefaultRichMenu(richMenuId);
}

async function linkRichMenuToUser(lineUserId, richMenuId) {
  return client.linkRichMenuIdToUser(lineUserId, richMenuId);
}

async function listRichMenus() {
  const result = await client.getRichMenuList();
  return result.richmenus || result.richMenus || [];
}

async function deleteRichMenu(richMenuId) {
  return client.deleteRichMenu(richMenuId);
}

/**
 * Default 4-area member rich menu definition. The bot image itself
 * (2500x1686 or 2500x843 PNG/JPEG) must be uploaded separately via
 * uploadRichMenuImage() - this only defines the tappable areas.
 */
function buildDefaultMemberRichMenuDefinition() {
  return {
    size: { width: 2500, height: 843 },
    selected: true,
    name: 'Grandfa Cafe Member Menu',
    chatBarText: 'Menu',
    areas: [
      {
        bounds: { x: 0, y: 0, width: 625, height: 843 },
        action: { type: 'message', text: 'member card' },
      },
      {
        bounds: { x: 625, y: 0, width: 625, height: 843 },
        action: { type: 'message', text: 'coupons' },
      },
      {
        bounds: { x: 1250, y: 0, width: 625, height: 843 },
        action: { type: 'message', text: 'promotion' },
      },
      {
        bounds: { x: 1875, y: 0, width: 625, height: 843 },
        action: { type: 'message', text: 'help' },
      },
    ],
  };
}

module.exports = {
  createRichMenu,
  uploadRichMenuImage,
  setDefaultRichMenu,
  linkRichMenuToUser,
  listRichMenus,
  deleteRichMenu,
  buildDefaultMemberRichMenuDefinition,
};