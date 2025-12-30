import { Types } from 'mongoose';
import { I18nString } from '../../board/types/boardTypes';

export type ChapterGroupData = {
  boardId: Types.ObjectId | string;
  examId: Types.ObjectId | string;
  subjectId: Types.ObjectId | string;
  name: I18nString;
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

