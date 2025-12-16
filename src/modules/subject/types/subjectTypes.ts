import { Types } from 'mongoose';

export type SubjectData = {
  boardId: Types.ObjectId | string;
  examId: Types.ObjectId | string;
  name: string;
  slug: string;
  order?: number;
  isActive?: boolean;
  boardSlug: string;
  examSlug: string;
  pathSlugs: string[];
  pathKey: string;
};

export type SubjectResponse = {
  success: boolean;
  statusCode: number;
  message: string;
  data?: any;
  error?: any;
};

