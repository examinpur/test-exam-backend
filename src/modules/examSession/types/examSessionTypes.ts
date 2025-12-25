import { Types } from 'mongoose';

export type QuestionResponseData = {
  questionId: Types.ObjectId | string;
  chosenIdentifiers?: string[];
  freeTextAnswer?: string;
  marksAwarded?: number;
  isCorrect?: boolean;
  timeSpent?: number;
  order: number;
  flagged?: boolean;
  meta?: any;
};

export type ExamTestData = {
  testId: string;
  title: string;
  examKey?: string;
  syllabus?: string;
  totalQuestions?: number;
  marks?: number;
  maxNegMarks?: number;
  timeAllotted?: number;
  layout?: string;
  allowRandomize?: boolean;
  questionPool?: (Types.ObjectId | string)[];
  languages?: string[];
  isPremium?: boolean;
  maxAttempt?: number;
  percentileId?: string;
};

export type ExamSessionData = {
  userId: Types.ObjectId | string;
  testId: string;
  seriesId?: string;
  questionOrder?: (Types.ObjectId | string)[];
  randomSeed?: string;
  responses?: QuestionResponseData[];
  correctCount?: number;
  wrongCount?: number;
  skippedCount?: number;
  totalMarks?: number;
  negativeMarks?: number;
  accuracy?: number;
  timeSpent?: number;
  subjectStats?: any;
  startedAt?: Date;
  lastSeenAt?: Date;
  submittedAt?: Date;
  status?: 'in_progress' | 'submitted' | 'evaluated' | 'cancelled';
  attemptNumber?: number;
  ip?: string;
  device?: string;
  platform?: string;
  isAnalysisVisible?: boolean;
  evaluationSnapshot?: any;
};

export type ExamSessionResponse = {
  success: boolean;
  statusCode: number;
  message: string;
  data?: any;
  error?: any;
};


