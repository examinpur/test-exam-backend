import { Types } from 'mongoose';

export type ChapterData = {
  boardId: Types.ObjectId;
  examId: Types.ObjectId;
  subjectId: Types.ObjectId;
  name: string;
  slug: string;
  order?: number;
  isActive?: boolean;
  boardSlug: string;
  examSlug: string;
  subjectSlug: string;
  pathSlugs: string[];
  pathKey: string;
};

export type ChapterResponse = {
  success: boolean;
  statusCode: number;
  message: string;
  data?: any;
  error?: any;
};

