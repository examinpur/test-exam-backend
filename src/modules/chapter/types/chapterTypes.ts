import { Types } from 'mongoose';

export type ChapterData = {
  boardId: Types.ObjectId | string;
  examId: Types.ObjectId | string;
  subjectId: Types.ObjectId | string;
  chapterGroupId: Types.ObjectId | string;
  name: string;
  slug: string;
  order?: number;
  isActive?: boolean;
  boardSlug: string;
  examSlug: string;
  subjectSlug: string;
  chapterGroupSlug: string;
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
