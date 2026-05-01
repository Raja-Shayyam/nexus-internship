import { body, param } from 'express-validator';
import DOMPurify from 'isomorphic-dompurify';

export const validateEmail = (fieldName = 'email') =>
  body(fieldName)
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required');

export const validatePassword = (fieldName = 'password') =>
  body(fieldName)
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    // .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character');

export const validateMongoId = (fieldName) =>
  param(fieldName)
    .isMongoId()
    .withMessage('Invalid ID format');

export const validateUrl = (fieldName) =>
  body(fieldName)
    .isURL()
    .withMessage('Valid URL required');

export const validateAmount = (fieldName = 'amount', min = 1) =>
  body(fieldName)
    .isFloat({ min })
    .withMessage(`Amount must be at least ${min}`);

export const sanitizeInput = (input) => {
  return DOMPurify.sanitize(input).trim().replace(/[<>]/g, '');
};

export const sanitizeObjectInputs = (obj) => {
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObjectInputs(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

export const preventNoSQLInjection = (obj) => {
  for (const key in obj) {
    if (/^\$/.test(key)) {
      delete obj[key];
    }
  }
  return obj;
};