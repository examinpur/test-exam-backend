import mongoose from 'mongoose';
import logger from '../../../utils/logger';
import { Request, Response } from 'express';

import User from '../../../models/authModel';

import {
  hashPassword,
  comparePasswords,
} from '../../../utils/hash';
import { generateToken } from '../../../utils/jwt';

import {
  validateUserProfile,
  validateEmailAndPassword,
  validateUserProfileUpdate,
} from '../validation/authValidator';

// Helpers
// const makeOTP = () => Math.floor(100000 + Math.random() * 900000);
const makeOTP = () => 123456;

const registerUser = async (req: Request, res: Response) => {
  try {
    const {
      businessName,
      firstName,
      lastName,
      email,
      password,
      role,
      countryCode,
      phone,
      businessId,
    } = req.body;

    const validation = validateUserProfile(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: `Validation failed: ${JSON.parse(validation?.error?.message)[0]?.path[0]} - ${JSON.parse(validation?.error?.message)[0]?.message}`,
        error: JSON.parse(validation?.error?.message) || validation?.error || validation,
      });
    }

    if (role === 'business' && !businessName) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Business Name is required',
      });
    }

    if (role === 'staff') {
      if (!businessId || !mongoose.Types.ObjectId.isValid(businessId)) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'Valid Business Id is required',
        });
      } else {
        const businessExists = await User.findById(businessId);
        if (!businessExists) {
          return res.status(404).json({
            success: false,
            statusCode: 404,
            message: 'Business Not Found',
          });
        }
      }
    }

    const exists = await User.findOne({ $or: [{ email }, { phone }] });
    if (exists) return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'User already exists',
    });

    const hashed = await hashPassword(password);
    const otp = makeOTP();

    const newUser = await User.create({
      email,
      countryCode,
      phone,
      password: hashed,
      role: role || 'user',
      firstName,
      lastName,
      emailOtp: otp,
      emailOtpSentCount: 1,
      isVerified: false,
      isActive: true,
    });

    // TODO: Send email with otp

    if (role === 'staff') {
      await BusinessStaff.create({
        business: businessId,
        staff: newUser._id,
      });
    } else if (role === 'business') {
      await BusinessSetting.create({
        businessName,
        business: newUser._id,
      });
    }

    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'User registered',
      data: {
        user: {
          _id: newUser._id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          countryCode: newUser.countryCode,
          phone: newUser.phone,
          role: newUser.role,
        },
      },
    });
  } catch (err: any) {
    logger.error(`Error occurred while registering the business owner or staff: ${err?.message || err?.response?.error?.message || err?.response?.error || err}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: err.message || err,
    });
  }
};

const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const validation = validateEmailAndPassword({ email, password });
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: `Validation failed: ${JSON.parse(validation?.error?.message)[0]?.path[0]} - ${JSON.parse(validation?.error?.message)[0]?.message}`,
        error: JSON.parse(validation?.error?.message) || validation?.error || validation,
      });
    }

    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ success: false, statusCode: 404, message: 'User not found' });

    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: 'Your password has not been set up yet. Please check your email to set up your password',
      });
    }

    if (user.role !== 'business') {
      return res.status(403).json({
        success: false,
        statusCode: 403,
        message: 'Not allowed, Please use Business credentials to login',
      });
    }

    if (!user.isActive || !user.isVerified) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Business is either not verified or not active right now',
      });
    }

    const ok = await comparePasswords(password, user.password);
    if (!ok) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: 'Invalid credentials',
      });
    }

    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      name: `${user.firstName || ''} ${user.lastName || ''}`,
      phone: user.phone || '',
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Logged in',
      data: {
        token,
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          countryCode: user.countryCode,
          phone: user.phone,
          role: user.role,
        },
      },
    });
  } catch (err: any) {
    logger.error(`Error occurred while login user: ${err?.message || err?.response?.error?.message || err?.response?.error || err}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: err.message || err,
    });
  }
};

const updateUserDetails = async (req: Request, res: Response) => {
  try {
    const data = req.body;

    const validation = validateUserProfileUpdate(data);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: `Validation failed: ${JSON.parse(validation?.error?.message)[0]?.path[0]} - ${JSON.parse(validation?.error?.message)[0]?.message}`,
        error: JSON.parse(validation?.error?.message) || validation?.error || validation,
      });
    }

    if (!data.email) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Email required to update user',
      });
    }

    const user = await User.findOneAndUpdate(
      { email: data.email },
      { ...data },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'User updated',
      data: {
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          countryCode: user.countryCode,
          phone: user.phone,
          role: user.role,
        },
      },
    });
  } catch (err: any) {
    logger.error(`Error occurred while updating user details: ${err?.message || err?.response?.error?.message || err?.response?.error || err}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: err.message || err,
    });
  }
};

const sendOtpToEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Email required',
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'User not found',
      });
    }

    const otp = makeOTP();
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    if ((user?.emailOtpSentCount || 0) >= 3 && user.updatedAt > oneHourAgo) {
      return res.status(429).json({
        success: false,
        statusCode: 429,
        message: 'Too many OTP requests. Please try again after 1 hour.',
      });
    }

    user.emailOtp = otp;
    user.emailOtpSentCount = (user?.emailOtpSentCount || 0) + 1;
    user.updatedAt = new Date();
    await user.save();

    // TODO: send email with otp

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'OTP sent to email',
    });
  } catch (err: any) {
    logger.error(`Error occurred while resending the OTP: ${err?.message || err?.response?.error?.message || err?.response?.error || err}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: err.message || err,
    });
  }
};

const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    const { token } = req.query;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Email and OTP required',
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'User not found',
      });
    }

    if (user.emailOtp !== Number(otp)) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Invalid OTP',
      });
    }

    user.emailOtp = null;
    user.emailOtpSentCount = 0;
    user.isVerified = true;
    user.isActive = true;
    await user.save();

    if (token && token === 'true') {
      const token = generateToken({
        id: user._id.toString(),
        name: user.firstName,
        email: user.email,
        phone: user.phone,
      });

      return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Email verified',
        data: {
          token,
          user: {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            countryCode: user.countryCode,
            phone: user.phone,
            role: user.role,
          },
        },
      });
    }

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Email verified',
      data: { user },
    });
  } catch (err: any) {
    logger.error(`Error occurred while verifying Email: ${err?.message || err?.response?.error?.message || err?.response?.error || err}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: err.message || err,
    });
  }
};

const sendOtpToPhone = async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Phone required',
      });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'User not found',
      });
    }

    const otp = makeOTP();
    user.phoneOtp = otp;
    user.phoneOtpSentCount = (user.phoneOtpSentCount || 0) + 1;
    user.updatedAt = new Date();
    await user.save();

    // TODO: send Whatsapp with otp

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'OTP sent to phone',
    });
  } catch (err: any) {
    logger.error(`Error occurred while sending OTP to phone: ${err?.message || err?.response?.error?.message || err?.response?.error || err}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: err.message || err,
    });
  }
};

const verifyPhone = async (req: Request, res: Response) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Phone and OTP required',
      });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'User not found',
      });
    }

    if (user.phoneOtp !== Number(otp)) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Invalid OTP',
      });
    }

    user.phoneOtp = null;
    user.phoneOtpSentCount = 0;
    user.isVerified = true;
    user.isActive = true;
    await user.save();

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Phone verified',
      data: {
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          countryCode: user.countryCode,
          phone: user.phone,
          role: user.role,
        },
      },
    });
  } catch (err: any) {
    logger.error(`Error occurred while verifying phone number: ${err?.message || err?.response?.error?.message || err?.response?.error || err}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal error',
      error: err.message || err,
    });
  }
};

const updatePasswordAfterVerification = async (req: Request, res: Response) => {
  try {
    const { email, phone, otp, password } = req.body;
    if (!password) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Password required',
      });
    }

    let user;
    if (email) {
      user = await User.findOne({ email });
    } else if (phone) {
      user = await User.findOne({ phone });
    } else {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Email or phone required',
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'User not found',
      });
    }

    const validOtp = email ? user.emailOtp === Number(otp) : user.phoneOtp === Number(otp);
    if (!validOtp) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Invalid OTP',
      });
    }

    user.password = await hashPassword(password);
    user.emailOtp = null;
    user.phoneOtp = null;
    user.emailOtpSentCount = 0;
    user.phoneOtpSentCount = 0;
    await user.save();

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Password updated',
      data: {
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          countryCode: user.countryCode,
          phone: user.phone,
          role: user.role,
        },
      },
    });
  } catch (err: any) {
    logger.error(`Error occurred while updating password after verification: ${err?.message || err?.response?.error?.message || err?.response?.error || err}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: err.message || err,
    });
  }
};

const resetPassword = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { password } = req.body;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Invalid user id',
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Password required',
      });
    }

    const hashed = await hashPassword(password);
    const user = await User.findByIdAndUpdate(userId, { password: hashed }, { new: true });
    if (!user) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Password reset',
      data: {
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          countryCode: user.countryCode,
          phone: user.phone,
          role: user.role,
        },
      },
    });
  } catch (err: any) {
    logger.error(`Error occurred while resetting passwords: ${err?.message || err?.response?.error?.message || err?.response?.error || err}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: err.message || err,
    });
  }
};

const getUserDetails = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Invalid user id',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'User fetched',
      data: {
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          countryCode: user.countryCode,
          phone: user.phone,
          role: user.role,
        },
      },
    });
  } catch (err: any) {
    logger.error(`Error occurred while getting users details: ${err?.message || err?.response?.error?.message || err?.response?.error || err}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: err.message || err,
    });
  }
};

const deleteUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Invalid user id',
      });
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      statusCode: 204,
      message: 'User deleted',
      data: {
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          countryCode: user.countryCode,
          phone: user.phone,
          role: user.role,
        },
      },
    });
  } catch (err: any) {
    logger.error(`Error occurred while deleting the user: ${err?.message || err?.response?.error?.message || err?.response?.error || err}`);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: err.message || err,
    });
  }
};

export default {
  registerUser,
  loginUser,
  updateUserDetails,
  sendOtpToEmail,
  verifyEmail,
  sendOtpToPhone,
  verifyPhone,
  updatePasswordAfterVerification,
  resetPassword,
  getUserDetails,
  deleteUser,
};
