import { Types } from 'mongoose';

export type TopicData = {
  boardId: Types.ObjectId | string;
  examId: Types.ObjectId | string;
  subjectId: Types.ObjectId | string;
  chapterGroupId: Types.ObjectId | string;
  chapterId: Types.ObjectId | string;
  name: string;
  slug: string;
  order?: number;
  isActive?: boolean;
  boardSlug: string;
  examSlug: string;
  subjectSlug: string;
  chapterGroupSlug: string;
  chapterSlug: string;
  pathSlugs: string[];
  pathKey: string;
};

export type TopicResponse = {
  success: boolean;
  statusCode: number;
  message: string;
  data?: any;
  error?: any;
};
