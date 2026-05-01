import mongoose from 'mongoose';
import { DEAL_STATUS } from '../config/constants.js';

const dealSchema = new mongoose.Schema(
  {
    entrepreneurId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    investorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: [
        DEAL_STATUS.NEGOTIATION,
        DEAL_STATUS.TERM_SHEET,
        DEAL_STATUS.FUNDED,
        DEAL_STATUS.FAILED,
        DEAL_STATUS.CLOSED,
      ],
      default: DEAL_STATUS.NEGOTIATION,
    },
    fundingAmount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    equityPercentage: {
      type: Number,
      default: 0,
    },
    documents: [
      {
        filename: String,
        url: String,
        type: String, // 'term_sheet', 'nda', 'contract', etc.
        uploadedAt: Date,
      },
    ],
    comments: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    startDate: {
      type: Date,
      default: null,
    },
    closureDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Deal = mongoose.model('Deal', dealSchema);
export default Deal;
