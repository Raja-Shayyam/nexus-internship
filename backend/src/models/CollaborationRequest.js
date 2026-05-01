import mongoose from 'mongoose';
import { COLLABORATION_STATUS } from '../config/constants.js';

const collaborationRequestSchema = new mongoose.Schema(
  {
    initiatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipientId: {
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
        COLLABORATION_STATUS.PENDING,
        COLLABORATION_STATUS.ACCEPTED,
        COLLABORATION_STATUS.REJECTED,
        COLLABORATION_STATUS.CANCELLED,
      ],
      default: COLLABORATION_STATUS.PENDING,
    },
    collaborationType: {
      type: String,
      enum: ['mentorship', 'partnership', 'investment', 'advisory'],
      required: true,
    },
    attachments: [
      {
        filename: String,
        url: String,
      },
    ],
    message: {
      type: String,
      default: '',
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const CollaborationRequest = mongoose.model('CollaborationRequest', collaborationRequestSchema);
export default CollaborationRequest;
