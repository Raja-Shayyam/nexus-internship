import jwt from 'jsonwebtoken';
import { User, Entrepreneur, Investor } from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import { ValidationError, ConflictError, UnauthorizedError } from '../utils/errors.js';
import logger from '../utils/logger.js';

class AuthService {
  generateTokens(payload) {
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET || 'secret', {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    });
    const refreshToken = jwt.sign(
      payload,
      process.env.JWT_REFRESH_SECRET || 'refresh_secret',
      { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
    );
    return { accessToken, refreshToken };
  }

  async register(payload) {
    try {
      const existingUser = await User.findOne({ email: payload.email });
      if (existingUser) throw new ConflictError('Email already registered');

      if (payload.password.length < 6) {
        throw new ValidationError('Password must be at least 6 characters');
      }

      let user;
      if (payload.role === 'entrepreneur') {
        user = new Entrepreneur(payload);
      } else {
        user = new Investor(payload);
      }

      user.avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(payload.name)}&background=random`;
      await user.save();

      logger.info(`User registered: ${user.email}`);

      const tokens = this.generateTokens({
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      await this.saveRefreshToken(user._id.toString(), tokens.refreshToken);

      return {
        user: this.sanitizeUser(user),
        ...tokens,
      };
    } catch (error) {
      logger.error(`Registration error: ${error.message}`);
      throw error;
    }
  }

  async login(payload) {
    try {
      const user = await User.findOne({ email: payload.email }).select('+password');
      if (!user) throw new UnauthorizedError('Invalid email or password');

      const isPasswordValid = await user.comparePassword(payload.password);
      if (!isPasswordValid) throw new UnauthorizedError('Invalid email or password');

      logger.info(`User logged in: ${user.email}`);

      const tokens = this.generateTokens({
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      await this.saveRefreshToken(user._id.toString(), tokens.refreshToken);

      return {
        user: this.sanitizeUser(user),
        ...tokens,
      };
    } catch (error) {
      logger.error(`Login error: ${error.message}`);
      throw error;
    }
  }

  async refreshAccessToken(refreshToken) {
    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || 'refresh_secret'
      );

      const tokenDoc = await RefreshToken.findOne({ token: refreshToken });
      if (!tokenDoc) throw new UnauthorizedError('Refresh token not found');

      const tokens = this.generateTokens(decoded);

      await RefreshToken.findByIdAndUpdate(tokenDoc._id, {
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      return tokens;
    } catch (error) {
      logger.error(`Token refresh error: ${error.message}`);
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  async saveRefreshToken(userId, token) {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await RefreshToken.create({ userId, token, expiresAt });
  }

  async logout(refreshToken) {
    try {
      await RefreshToken.deleteOne({ token: refreshToken });
      logger.info('User logged out');
    } catch (error) {
      logger.error(`Logout error: ${error.message}`);
    }
  }

  sanitizeUser(user) {
    const userObj = user.toObject ? user.toObject() : user;
    delete userObj.password;
    delete userObj.resetPasswordToken;
    delete userObj.resetPasswordExpire;
    delete userObj.verificationToken;
    return userObj;
  }
}

export default new AuthService();