import { Types } from 'mongoose';

export type ChapterGroupData = {
  boardId: Types.ObjectId | string;
  examId: Types.ObjectId | string;
  subjectId: Types.ObjectId | string;
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

export type ChapterGroupResponse = {
  success: boolean;
  statusCode: number;
  message: string;
  data?: any;
  error?: any;
};

