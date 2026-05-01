import { User } from '../models/User.js';
import nodemailer from 'nodemailer';
import { ValidationError, UnauthorizedError } from '../utils/errors.js';
import logger from '../utils/logger.js';

class TwoFactorService {
  constructor() {
    this.otpStore = new Map(); // in-memory; use Redis in production
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendOTP(email) {
    try {
      const otp = this.generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      this.otpStore.set(email, { otp, expiresAt });

      await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: 'Your Nexus 2FA Code',
        html: `
          <h2>Two-Factor Authentication</h2>
          <p>Your OTP code is: <strong>${otp}</strong></p>
          <p>This code expires in 10 minutes.</p>
          <p>If you did not request this, please ignore this email.</p>
        `,
      });
      logger.info(`OTP sent to ${email}`);
    } catch (error) {
      logger.error(`Send OTP error: ${error.message}`);
      throw error;
    }
  }

  async verifyOTP(email, otp) {
    const stored = this.otpStore.get(email);
    if (!stored) throw new UnauthorizedError('OTP not found or expired');
    if (new Date() > stored.expiresAt) {
      this.otpStore.delete(email);
      throw new UnauthorizedError('OTP expired');
    }
    if (stored.otp !== otp) throw new UnauthorizedError('Invalid OTP');

    this.otpStore.delete(email);
    logger.info(`OTP verified for ${email}`);
    return true;
  }

  async enable2FA(userId) {
    const user = await User.findById(userId);
    if (!user) throw new ValidationError('User not found');
    user.twoFactorEnabled = true;
    user.twoFactorSecret = Math.random().toString(36).substring(2, 15);
    await user.save();
    logger.info(`2FA enabled for user: ${userId}`);
  }

  async disable2FA(userId) {
    const user = await User.findById(userId);
    if (!user) throw new ValidationError('User not found');
    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    await user.save();
    logger.info(`2FA disabled for user: ${userId}`);
  }
}

export default new TwoFactorService();