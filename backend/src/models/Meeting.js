import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Meeting title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    initiatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    participantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required'],
    },
    duration: {
      type: Number,
      required: true, // auto‑calculated
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
      default: 'pending',
    },
    meetingType: {
      type: String,
      enum: ['video_call', 'discussion', 'pitch', 'negotiation'],
      default: 'discussion',
    },
    roomId: String,
    meetingNotes: String,
  },
  { timestamps: true }
);

// Indexes
meetingSchema.index({ initiatorId: 1, startTime: 1 });
meetingSchema.index({ participantId: 1, startTime: 1 });
meetingSchema.index({ status: 1, startTime: 1 });

// Pre‑save validation & duration calculation
meetingSchema.pre('save', function (next) {
  if (this.endTime <= this.startTime) {
    return next(new Error('End time must be after start time'));
  }
  const durationMs = this.endTime.getTime() - this.startTime.getTime();
  this.duration = Math.round(durationMs / (1000 * 60)); // minutes
  next();
});

export default mongoose.model('Meeting', meetingSchema);