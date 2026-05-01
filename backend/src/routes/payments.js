import { Router, json } from 'express';
import {
  createPaymentIntent,
  depositFunds,
  withdrawFunds,
  transferFunds,
  getTransactionHistory,
  getWalletBalance,
  handleWebhook,
  validateDeposit,
  validateTransfer,
} from '../controllers/paymentController.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';

const router = Router();

// Stripe webhook needs raw body – use express.raw before JSON middleware in app
router.post('/webhook', json({ type: 'application/json' }), handleWebhook);

router.use(authenticate);

router.post('/payment-intent', createPaymentIntent);
router.post('/deposit', validateDeposit, validateRequest, depositFunds);
router.post('/withdraw', withdrawFunds);
router.post('/transfer', validateTransfer, validateRequest, transferFunds);
router.get('/history', getTransactionHistory);
router.get('/wallet', getWalletBalance);

export default router;