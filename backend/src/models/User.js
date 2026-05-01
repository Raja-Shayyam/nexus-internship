import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import logger from '../utils/logger.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['entrepreneur', 'investor'],
      required: [true, 'Please specify a role'],
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
    },
    location: {
      type: String,
      maxlength: [100, 'Location cannot exceed 100 characters'],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: String,
  },
  {
    timestamps: true,
    discriminatorKey: 'role',
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    logger.error(`Password hashing error: ${error.message}`);
    next();
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

// Entrepreneur discriminator schema
const entrepreneurSchema = new mongoose.Schema({
  startupName: {
    type: String,
    maxlength: [100, 'Startup name cannot exceed 100 characters'],
  },
  pitchSummary: {
    type: String,
    maxlength: [1000, 'Pitch cannot exceed 1000 characters'],
  },
  fundingNeeded: Number,
  fundingCurrency: {
    type: String,
    default: 'USD',
  },
  industry: String,
  foundedYear: Number,
  teamSize: Number,
  websiteUrl: String,
});

// Investor discriminator schema
const investorSchema = new mongoose.Schema({
  investmentInterests: [String],
  investmentStages: [String],
  portfolioCompanies: [String],
  totalInvestments: {
    type: Number,
    default: 0,
  },
  minimumInvestment: Number,
  maximumInvestment: Number,
});

const User = mongoose.model('User', userSchema);
const Entrepreneur = User.discriminator('entrepreneur', entrepreneurSchema);
const Investor = User.discriminator('investor', investorSchema);

export { User, Entrepreneur, Investor };