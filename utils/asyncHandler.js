// utils/asyncHandler.js
// Wraps an async Express route/middleware so rejected promises are
// forwarded to next(err) automatically. Keeps route files free of
// repetitive try/catch blocks.

function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;