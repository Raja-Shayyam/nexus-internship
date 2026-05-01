import mongoose from 'mongoose';

const eSignatureSchema = new mongoose.Schema({
  signedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  signatureUrl: String,
  signedAt: {
    type: Date,
    default: () => new Date(),
  },
});

const shareSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  permission: {
    type: String,
    enum: ['view', 'comment', 'edit'],
    default: 'view',
  },
  sharedAt: {
    type: Date,
    default: () => new Date(),
  },
});

const documentSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
    },
    fileType: {
      type: String,
      required: [true, 'File type is required'],
    },
    fileSize: {
      type: Number,
      required: [true, 'File size is required'],
    },
    cloudinaryUrl: {
      type: String,
      required: true,
    },
    cloudinaryPublicId: {
      type: String,
      required: true,
      unique: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    documentType: {
      type: String,
      enum: ['proposal', 'term_sheet', 'contract', 'pitch_deck', 'financial', 'other'],
      default: 'other',
    },
    status: {
      type: String,
      enum: ['draft', 'shared', 'signed', 'archived'],
      default: 'draft',
    },
    relatedMeetingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meeting',
    },
    sharedWith: [shareSchema],
    eSignature: eSignatureSchema,
    version: {
      type: Number,
      default: 1,
    },
    tags: [String],
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
  },
  { timestamps: true }
);

documentSchema.index({ uploadedBy: 1, createdAt: -1 });
documentSchema.index({ 'sharedWith.userId': 1 });
documentSchema.index({ status: 1 });

export default mongoose.model('Document', documentSchema);