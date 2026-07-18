// utils/AppError.js
// A typed error carrying an HTTP status code, thrown anywhere in
// service/route code and caught by the central error middleware.

class AppError extends Error {
  constructor(message, statusCode = 400, errors = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;