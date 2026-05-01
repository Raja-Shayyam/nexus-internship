import { stripe } from '../config/stripe.js'; // note: we'll adjust import
import Transaction from '../models/Transaction.js';
import Wallet from '../models/Wallet.js';
import { User } from '../models/User.js';
import { ValidationError, NotFoundError, AppError } from '../utils/errors.js';
import logger from '../utils/logger.js';

// Re-import stripe properly
import Stripe from 'stripe';
const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' });

class PaymentService {
  async getOrCreateWallet(userId) {
    try {
      let wallet = await Wallet.findOne({ userId });
      if (!wallet) {
        wallet = new Wallet({ userId, balance: 0 });
        await wallet.save();
        logger.info(`Wallet created for user: ${userId}`);
      }
      return wallet;
    } catch (error) {
      logger.error(`Get/Create wallet error: ${error.message}`);
      throw error;
    }
  }

  async deposit(userId, amount, paymentMethodId) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new NotFoundError('User');

      if (amount <= 0 || amount < 10) {
        throw new ValidationError('Minimum deposit amount is $10');
      }

      const paymentIntent = await stripeInstance.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: 'usd',
        payment_method: paymentMethodId,
        confirm: true,
        metadata: { userId, transactionType: 'deposit' },
      });

      const transaction = new Transaction({
        userId,
        type: 'deposit',
        amount,
        currency: 'USD',
        status: paymentIntent.status === 'succeeded' ? 'completed' : 'pending',
        stripePaymentIntentId: paymentIntent.id,
        description: 'Deposit to wallet',
        metadata: paymentIntent.metadata,
      });
      await transaction.save();

      const wallet = await this.getOrCreateWallet(userId);

      if (paymentIntent.status === 'succeeded') {
        wallet.balance += amount;
        await wallet.save();
        logger.info(`Deposit successful: ${userId}, Amount: ${amount}`);
      }

      return { transaction, paymentIntent, wallet };
    } catch (error) {
      logger.error(`Deposit error: ${error.message}`);
      throw error;
    }
  }

  async withdraw(userId, amount) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new NotFoundError('User');

      const wallet = await this.getOrCreateWallet(userId);
      if (amount > wallet.balance) throw new ValidationError('Insufficient funds');
      if (amount <= 0) throw new ValidationError('Invalid withdrawal amount');

      wallet.balance -= amount;
      await wallet.save();

      const transaction = new Transaction({
        userId,
        type: 'withdraw',
        amount,
        currency: 'USD',
        status: 'completed',
        description: 'Withdrawal from wallet',
      });
      await transaction.save();

      logger.info(`Withdrawal completed: ${userId}, Amount: ${amount}`);
      return { transaction, wallet };
    } catch (error) {
      logger.error(`Withdraw error: ${error.message}`);
      throw error;
    }
  }

  async transferFunds(senderId, recipientId, amount, description) {
    try {
      const sender = await User.findById(senderId);
      const recipient = await User.findById(recipientId);
      if (!sender || !recipient) throw new NotFoundError('User');
      if (senderId === recipientId) throw new ValidationError('Cannot transfer to yourself');

      const senderWallet = await this.getOrCreateWallet(senderId);
      const recipientWallet = await this.getOrCreateWallet(recipientId);

      if (amount > senderWallet.balance) throw new ValidationError('Insufficient funds');

      senderWallet.balance -= amount;
      recipientWallet.balance += amount;

      await senderWallet.save();
      await recipientWallet.save();

      const transferTransaction = new Transaction({
        userId: senderId,
        type: 'transfer',
        amount,
        currency: 'USD',
        status: 'completed',
        destinationUserId: recipientId,
        description: description || `Transfer to ${recipient.name}`,
      });
      await transferTransaction.save();

      logger.info(`Transfer completed: ${senderId} -> ${recipientId}, Amount: ${amount}`);
      return {
        transaction: transferTransaction,
        senderWallet,
        recipientWallet,
      };
    } catch (error) {
      logger.error(`Transfer error: ${error.message}`);
      throw error;
    }
  }

  async getTransactionHistory(userId, limit = 20) {
    try {
      const transactions = await Transaction.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('destinationUserId', 'name email');
      return transactions;
    } catch (error) {
      logger.error(`Get transactions error: ${error.message}`);
      throw error;
    }
  }

  async getWalletBalance(userId) {
    try {
      const wallet = await this.getOrCreateWallet(userId);
      return wallet;
    } catch (error) {
      logger.error(`Get balance error: ${error.message}`);
      throw error;
    }
  }

  async handleWebhook(event) {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object;
          const transaction = await Transaction.findOne({
            stripePaymentIntentId: paymentIntent.id,
          });
          if (transaction && transaction.status === 'pending') {
            transaction.status = 'completed';
            await transaction.save();

            const wallet = await Wallet.findOne({ userId: transaction.userId });
            if (wallet) {
              wallet.balance += transaction.amount;
              await wallet.save();
            }
            logger.info(`Payment completed: ${paymentIntent.id}`);
          }
          break;
        }
        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object;
          const transaction = await Transaction.findOne({
            stripePaymentIntentId: paymentIntent.id,
          });
          if (transaction) {
            transaction.status = 'failed';
            transaction.failureReason = paymentIntent.last_payment_error?.message;
            await transaction.save();
            logger.warn(`Payment failed: ${paymentIntent.id}`);
          }
          break;
        }
        default:
          logger.debug(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      logger.error(`Webhook error: ${error.message}`);
      throw error;
    }
  }
}

export default new PaymentService();