import { Router } from 'express';
import {
  register,
  login,
  logout,
  refreshToken,
  getCurrentUser,
  validateRegister,
  validateLogin,
} from '../controllers/authController.js';
import {
  sendOTP,
  verifyOTP,
  enable2FA,
  disable2FA,
} from '../controllers/twoFactorController.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { loginLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Public
router.post('/register', validateRegister, validateRequest, register);
router.post('/login', loginLimiter, validateLogin, validateRequest, login);
router.post('/refresh-token', refreshToken);

// Protected
router.get('/me', authenticate, getCurrentUser);
router.post('/logout', authenticate, logout);

// 2FA
router.post('/2fa/send-otp', authenticate, sendOTP);
router.post('/2fa/verify-otp', authenticate, verifyOTP);
router.post('/2fa/enable', authenticate, enable2FA);
router.post('/2fa/disable', authenticate, disable2FA);

export default router;