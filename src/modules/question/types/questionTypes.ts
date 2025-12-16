import { Types } from 'mongoose';

export type QuestionData = {
  boardId: Types.ObjectId | string;
  examId: Types.ObjectId | string;
  subjectId: Types.ObjectId | string;
  chapterGroupId: Types.ObjectId | string;
  chapterId: Types.ObjectId | string;
  topicId?: Types.ObjectId | string;
  comprehensionId?: Types.ObjectId | string;
  comprehensionOrder?: number;
  slug: string;
  pathSlugs: string[];
  pathKey: string;
  kind: 'MCQ' | 'MSQ' | 'TRUE_FALSE' | 'INTEGER' | 'FILL_BLANK' | 'COMPREHENSION_PASSAGE';
  marks?: number;
  negMarks?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  calculator?: boolean;
  passage?: any;
  prompt?: any;
  correct?: any;
  year?: number;
  paperTitle?: string;
  paperId?: string;
  yearKey?: string;
  section?: string[];
  tags?: string[];
  isActive?: boolean;
};

export type QuestionResponse = {
  success: boolean;
  statusCode: number;
  message: string;
  data?: any;
  error?: any;
};

