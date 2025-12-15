import { Types } from 'mongoose';

export type TopicData = {
  boardId: Types.ObjectId;
  examId: Types.ObjectId;
  subjectId: Types.ObjectId;
  chapterId: Types.ObjectId;
  name: string;
  slug: string;
  order?: number;
  isActive?: boolean;
  boardSlug: string;
  examSlug: string;
  subjectSlug: string;
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

