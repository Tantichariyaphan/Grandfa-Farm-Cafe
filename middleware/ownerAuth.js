// middleware/ownerAuth.js
// Must be used AFTER requireStaffAuth in the middleware chain.
// Restricts a route to accounts with role = 'owner'.
//
// Example: router.get('/dashboard', requireStaffAuth, requireOwnerRole, handler)

const AppError = require('../utils/AppError');

function requireOwnerRole(req, res, next) {
  if (!req.staff) {
    throw new AppError('Authentication required', 401);
  }
  if (req.staff.role !== 'owner') {
    throw new AppError('Owner access required', 403);
  }
  return next();
}

module.exports = requireOwnerRole;