import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export const generateToken = (userId, email, userType) => {
  return jwt.sign(
    {
      userId,
      email,
      userType,
    },
    config.jwtSecret,
    {
      expiresIn: config.jwtExpire,
    }
  );
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

export const getPaginationParams = (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
  };
};

export const getResponseMeta = (page, limit, total) => {
  return {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  };
};

export default {
  generateToken,
  verifyToken,
  getPaginationParams,
  getResponseMeta,
};
