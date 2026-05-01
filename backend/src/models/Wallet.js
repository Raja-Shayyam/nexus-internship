import mongoose from 'mongoose';

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },
    stripeAccountId: String,
    bankAccount: {
      accountNumber: String,
      routingNumber: String,
      bankName: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Wallet', walletSchema);