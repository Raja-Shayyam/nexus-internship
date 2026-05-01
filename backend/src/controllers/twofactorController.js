import twoFactorService from '../services/twoFactorService.js';
import { sendSuccess, sendError } from '../utils/responses.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { HTTP_STATUS } from '../utils/constants.js';

export const sendOTP = asyncHandler(async (req, res) => {
  await twoFactorService.sendOTP(req.user.email);
  return sendSuccess(res, HTTP_STATUS.OK, 'OTP sent to email', { email: req.user.email });
});

export const verifyOTP = asyncHandler(async (req, res) => {
  const { otp } = req.body;
  if (!otp) return sendError(res, 400, 'OTP is required');
  await twoFactorService.verifyOTP(req.user.email, otp);
  return sendSuccess(res, HTTP_STATUS.OK, 'OTP verified successfully');
});

export const enable2FA = asyncHandler(async (req, res) => {
  await twoFactorService.enable2FA(req.user.id);
  return sendSuccess(res, HTTP_STATUS.OK, '2FA enabled', { twoFactorEnabled: true });
});

export const disable2FA = asyncHandler(async (req, res) => {
  await twoFactorService.disable2FA(req.user.id);
  return sendSuccess(res, HTTP_STATUS.OK, '2FA disabled', { twoFactorEnabled: false });
});