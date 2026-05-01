import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['deposit', 'withdraw', 'transfer', 'payment'],
      required: [true, 'Transaction type is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount must be positive'],
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'pending',
    },
    sourceWallet: String,
    destinationWallet: String,
    destinationUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    stripePaymentIntentId: String,
    stripeTransferId: String,
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    metadata: mongoose.Schema.Types.Mixed,
    failureReason: String,
  },
  { timestamps: true }
);

transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ stripePaymentIntentId: 1 });

export default mongoose.model('Transaction', transactionSchema);