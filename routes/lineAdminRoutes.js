const express = require('express');
const { body, param } = require('express-validator');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const requireStaffAuth = require('../middleware/staffAuth');
const requireOwnerRole = require('../middleware/ownerAuth');
const { ok, created } = require('../utils/response');
const { broadcastMessage } = require('../services/line/broadcast');
const { createRichMenu, uploadRichMenuImage, setDefaultRichMenu, listRichMenus, deleteRichMenu } = require('../services/line/richMenu');

const router = express.Router();
router.use(requireStaffAuth, requireOwnerRole);
router.post('/broadcast', validate([body('messages').isArray({ min: 1, max: 5 }), body('messages.*.type').isIn(['text', 'flex', 'image', 'video', 'audio', 'template'])]), asyncHandler(async (req, res) => {
  await broadcastMessage(req.body.messages);
  return ok(res, null, 'Broadcast accepted by LINE');
}));
router.get('/rich-menus', asyncHandler(async (req, res) => ok(res, await listRichMenus())));
router.post('/rich-menus', validate([body('definition').isObject(), body('definition.areas').isArray({ min: 1 })]), asyncHandler(async (req, res) => created(res, { richMenuId: await createRichMenu(req.body.definition) }, 'Rich menu created')));
router.post('/rich-menus/:id/image', validate([param('id').isString().notEmpty(), body('imageBase64').isString().isLength({ min: 8 }), body('contentType').isIn(['image/png', 'image/jpeg'])]), asyncHandler(async (req, res) => {
  const image = Buffer.from(req.body.imageBase64.replace(/^data:image\/(png|jpeg);base64,/, ''), 'base64');
  await uploadRichMenuImage(req.params.id, image, req.body.contentType);
  return ok(res, null, 'Rich menu image uploaded');
}));
router.post('/rich-menus/:id/default', validate([param('id').isString().notEmpty()]), asyncHandler(async (req, res) => { await setDefaultRichMenu(req.params.id); return ok(res, null, 'Default rich menu updated'); }));
router.delete('/rich-menus/:id', validate([param('id').isString().notEmpty()]), asyncHandler(async (req, res) => { await deleteRichMenu(req.params.id); return ok(res, null, 'Rich menu deleted'); }));
module.exports = router;
