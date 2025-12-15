import { Types } from 'mongoose';
import { IAuth } from '../../../interfaces/IAuth';

export type AuthUser = {
  _id: Types.ObjectId;
  email: string;
};

export type AuthCredentials = {
  email: string;
  password: string;
};

export type RegisterUserResponse = {
  success: boolean;
  statusCode: number;
  message: string;
  user?: AuthUser;
  error?: any;
};

export type LoginUserResponse = {
  success: boolean;
  statusCode: number;
  message: string;
  token?: string;
  user?: Omit<IAuth, 'password'>;
  error?: any;
};

export type ValidationResponse = {
  success: boolean;
  error?: {
    message: string;
  };
};

export type UpdateUserProfileData = Partial<{
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
}>;
