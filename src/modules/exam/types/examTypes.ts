import { Types } from 'mongoose';

export type ExamData = {
  boardId: Types.ObjectId;
  name: string;
  slug: string;
  order?: number;
  isActive?: boolean;
  boardSlug: string;
  pathSlugs: string[];
  pathKey: string;
};

export type ExamResponse = {
  success: boolean;
  statusCode: number;
  message: string;
  data?: any;
  error?: any;
};

