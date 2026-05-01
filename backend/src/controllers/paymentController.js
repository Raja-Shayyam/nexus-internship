import { body, validationResult } from 'express-validator';
import paymentService from '../services/paymentService.js';
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' });
import { sendSuccess, sendError } from '../utils/responses.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { HTTP_STATUS } from '../utils/constants.js';
import logger from '../utils/logger.js';

export const validateDeposit = [
  body('amount').isFloat({ min: 10 }).withMessage('Minimum deposit is $10'),
  body('paymentMethodId').notEmpty().withMessage('Payment method is required'),
];

export const validateTransfer = [
  body('recipientId').isMongoId().withMessage('Valid recipient ID required'),
  body('amount').isFloat({ min: 1 }).withMessage('Valid amount required'),
];

export const createPaymentIntent = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount < 10) return sendError(res, 400, 'Minimum amount is $10');

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: 'usd',
    metadata: { userId: req.user.id },
  });

  return sendSuccess(res, HTTP_STATUS.CREATED, 'Payment intent created', {
    clientSecret: paymentIntent.client_secret,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
});

export const depositFunds = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendError(res, 400, 'Validation failed', errors.array());

  const { amount, paymentMethodId } = req.body;
  const result = await paymentService.deposit(req.user.id, amount, paymentMethodId);
  return sendSuccess(res, HTTP_STATUS.CREATED, 'Deposit initiated', result);
});

export const withdrawFunds = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) return sendError(res, 400, 'Valid amount required');

  const result = await paymentService.withdraw(req.user.id, amount);
  return sendSuccess(res, HTTP_STATUS.OK, 'Withdrawal successful', result);
});

export const transferFunds = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendError(res, 400, 'Validation failed', errors.array());

  const { recipientId, amount, description } = req.body;
  const result = await paymentService.transferFunds(req.user.id, recipientId, amount, description);
  return sendSuccess(res, HTTP_STATUS.OK, 'Transfer successful', result);
});

export const getTransactionHistory = asyncHandler(async (req, res) => {
  const { limit } = req.query;
  const transactions = await paymentService.getTransactionHistory(
    req.user.id,
    limit ? parseInt(limit) : 20
  );
  return sendSuccess(res, HTTP_STATUS.OK, 'Transaction history', transactions);
});

export const getWalletBalance = asyncHandler(async (req, res) => {
  const wallet = await paymentService.getWalletBalance(req.user.id);
  return sendSuccess(res, HTTP_STATUS.OK, 'Wallet balance', wallet);
});

// Stripe webhook (raw body parser needed)
export const handleWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) return sendError(res, 400, 'Missing webhook signature');

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    await paymentService.handleWebhook(event);
    return sendSuccess(res, HTTP_STATUS.OK, 'Webhook processed');
  } catch (error) {
    logger.error(`Webhook error: ${error.message}`);
    return sendError(res, 400, 'Webhook error');
  }
});