import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { UnauthorizedError } from '../utils/errors.js';
import logger from '../utils/logger.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new UnauthorizedError('No token provided');

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = await User.findById(decoded.id);
    if (!user) throw new UnauthorizedError('User not found');

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`);
    next(new UnauthorizedError('Invalid or expired token'));
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return next(new UnauthorizedError('User not authenticated'));
    if (!roles.includes(req.user.role)) {
      return next(
        new UnauthorizedError(`Only ${roles.join(' or ')} can access this resource`)
      );
    }
    next();
  };
};