import { Document, Types } from 'mongoose';

export interface IAuth extends Document {
  _id: Types.ObjectId;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  password: string;
  role: 'student' | 'teacher' | 'admin';
  isVerified: boolean;
  isActive: boolean;

  emailOtp?: number | null;
  emailOtpSentCount?: number;
  phoneOtp?: number | null;
  phoneOtpSentCount?: number;

  createdAt: Date;
  updatedAt: Date;
}
