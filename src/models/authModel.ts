import mongoose from 'mongoose';

const authSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
    },
    email: {
      index: true,
      type: String,
      required: true,
      unique: true,
    },
    countryCode: {
      type: Number,
      required: true,
    },
    phone: {
      index: true,
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
    },
    role: {
      type: String,
      enum: ['user', 'staff', 'business', 'admin'],
      default: 'user',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    emailOtp: {
      type: Number,
    },
    emailOtpSentCount: {
      type: Number,
      default: 1,
    },
    phoneOtp: {
      type: Number,
    },
    phoneOtpSentCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: 'users',
  },
);

export default mongoose.model(
  'User',
  authSchema,
);
