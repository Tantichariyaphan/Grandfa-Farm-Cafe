// routes/stampRoutes.js
// All routes require staff authentication.
// POST /api/stamp/scan  - resolve a scanned member QR before entering quantity
// POST /api/stamp/add   - record a purchase and add stamps

const express = require('express');
const { body } = require('express-validator');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const requireStaffAuth = require('../middleware/staffAuth');
const { ok } = require('../utils/response');
const { scanMember, addStamp } = require('../services/stamp/stampService');

const router = express.Router();

router.use(requireStaffAuth);

router.post(
  '/scan',
  validate([body('qrToken').isString().notEmpty().withMessage('qrToken is required')]),
  asyncHandler(async (req, res) => {
    const member = await scanMember(req.body.qrToken);
    return ok(res, member, 'Member found');
  })
);

router.post(
  '/add',
  validate([
    body('memberUid').isString().notEmpty().withMessage('memberUid is required'),
    body('drinkQuantity').isInt({ min: 1, max: 50 }).withMessage('drinkQuantity must be 1-50'),
    body('idempotencyKey').optional().isString(),
  ]),
  asyncHandler(async (req, res) => {
    const { memberUid, drinkQuantity, idempotencyKey } = req.body;
    const result = await addStamp({
      memberUid,
      staffId: req.staff.id,
      drinkQuantity,
      idempotencyKey: idempotencyKey || null,
    });
    return ok(res, result, 'Stamp(s) added');
  })
);

module.exports = router;
