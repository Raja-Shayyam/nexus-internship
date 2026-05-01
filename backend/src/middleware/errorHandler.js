import { AppError } from '../utils/errors.js';
import { sendError } from '../utils/responses.js';
import logger from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  logger.error(`Error: ${err.message}`);

  if (err instanceof AppError) {
    return sendError(res, err.statusCode, err.message, err);
  }

  if (err.name === 'ValidationError') {
    return sendError(res, 400, 'Validation failed', err);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return sendError(res, 409, `${field} already exists`);
  }

  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 401, 'Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, 401, 'Token expired');
  }

  return sendError(res, 500, 'Internal server error', err);
};

// Async error wrapper
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};