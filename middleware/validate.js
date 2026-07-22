// middleware/validate.js
// Runs an array of express-validator chains, then rejects the request
// with a consistent 400 response if any of them failed. Usage:
//   router.post('/x', validate([body('foo').isString()]), handler)

const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

function validate(validations) {
  return async (req, res, next) => {
    const isCouponRequest = req.baseUrl === '/api/coupon';
    if (isCouponRequest) {
      console.info('[coupon validation] incoming request', {
        method: req.method,
        path: req.path,
        body: req.body,
        errors: validationResult(req).array(),
      });
    }

    for (const validation of validations) {
      // eslint-disable-next-line no-await-in-loop
      await validation.run(req);
    }

    const result = validationResult(req);
    if (isCouponRequest) {
      console.info('[coupon validation] result', result.array());
    }
    if (result.isEmpty()) {
      return next();
    }

    const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
    return next(new AppError('Validation failed', 422, errors));
  };
}

module.exports = validate;
