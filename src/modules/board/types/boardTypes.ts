import { Types } from 'mongoose';

export type BoardData = {
  name: string;
  slug: string;
  order?: number;
  isActive?: boolean;
};

export type BoardResponse = {
  success: boolean;
  statusCode: number;
  message: string;
  data?: any;
  error?: any;
};

