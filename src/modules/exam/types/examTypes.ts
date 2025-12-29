import { Types } from 'mongoose';
import { I18nString } from '../../board/types/boardTypes';


export type ExamData = {
  boardId: Types.ObjectId | string;
  name: I18nString;
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

