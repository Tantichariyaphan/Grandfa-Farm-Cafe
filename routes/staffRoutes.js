const express = require('express');
const { body, param } = require('express-validator');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const requireStaffAuth = require('../middleware/staffAuth');
const requireOwnerRole = require('../middleware/ownerAuth');
const { ok, created } = require('../utils/response');
const { createStaffAccount, listStaffAccounts, setStaffActive, resetStaffPassword } = require('../services/staffManagementService');

const router = express.Router();
router.use(requireStaffAuth, requireOwnerRole);
router.get('/', asyncHandler(async (req, res) => ok(res, await listStaffAccounts())));
router.post('/', validate([body('username').isString().trim().isLength({ min: 3, max: 80 }), body('password').isString().isLength({ min: 12, max: 128 }), body('displayName').isString().trim().isLength({ min: 1, max: 160 }), body('role').optional().isIn(['staff', 'owner'])]), asyncHandler(async (req, res) => created(res, await createStaffAccount(req.body), 'Staff account created')));
router.patch('/:id/active', validate([param('id').isInt({ min: 1 }), body('isActive').isBoolean()]), asyncHandler(async (req, res) => ok(res, await setStaffActive(req.params.id, req.body.isActive), 'Staff account updated')));
router.patch('/:id/password', validate([param('id').isInt({ min: 1 }), body('password').isString().isLength({ min: 12, max: 128 })]), asyncHandler(async (req, res) => ok(res, await resetStaffPassword(req.params.id, req.body.password), 'Password updated')));
module.exports = router;
