import { body, validationResult } from 'express-validator';
import authService from '../services/authService.js';
import { sendSuccess, sendError } from '../utils/responses.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../utils/constants.js';
import logger from '../utils/logger.js';

export const validateRegister = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['entrepreneur', 'investor']).withMessage('Role must be entrepreneur or investor'),
];

export const validateLogin = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const register = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 400, 'Validation failed', errors.array());
  }

  const { name, email, password, role } = req.body;
  const result = await authService.register({ name, email, password, role });

  logger.info(`User registered: ${email}`);

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  return sendSuccess(res, HTTP_STATUS.CREATED, SUCCESS_MESSAGES.REGISTER_SUCCESS, result);
});

export const login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 400, 'Validation failed', errors.array());
  }

  const { email, password } = req.body;
  const result = await authService.login({ email, password });

  logger.info(`User logged in: ${email}`);

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  return sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.LOGIN_SUCCESS, result);
});

export const refreshToken = asyncHandler(async (req, res) => {
  const refreshTokenValue = req.cookies.refreshToken || req.body.refreshToken;
  if (!refreshTokenValue) {
    return sendError(res, 401, 'Refresh token not provided');
  }
  const tokens = await authService.refreshAccessToken(refreshTokenValue);

  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  return sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.TOKEN_REFRESH_SUCCESS, tokens);
});

export const logout = asyncHandler(async (req, res) => {
  const refreshTokenValue = req.cookies.refreshToken || req.body.refreshToken;
  if (refreshTokenValue) {
    await authService.logout(refreshTokenValue);
  }
  res.clearCookie('refreshToken');
  return sendSuccess(res, HTTP_STATUS.OK, 'Logged out successfully');
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  return sendSuccess(res, HTTP_STATUS.OK, 'User fetched', req.user);
});