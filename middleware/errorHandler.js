// middleware/errorHandler.js
// Central error handler. Every route uses asyncHandler() so thrown
// errors (AppError or otherwise) land here via next(err).

const config = require('../config');
const { fail } = require('../utils/response');

// 404 handler - must be registered after all routes.
function notFoundHandler(req, res) {
  return fail(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational === true;

  if (!isOperational) {
    // eslint-disable-next-line no-console
    console.error('UNEXPECTED ERROR:', err);
  } else if (!config.isProduction) {
    // eslint-disable-next-line no-console
    console.error('OPERATIONAL ERROR:', err.message);
  }

  const message = isOperational ? err.message : 'Internal server error';
  return fail(res, statusCode, message, err.errors || null);
}

module.exports = { errorHandler, notFoundHandler };