import { z } from 'zod';

const questionResponseSchema = z.object({
  questionId: z.string().min(1, 'Question ID is required'),
  chosenIdentifiers: z.array(z.string()).optional(),
  freeTextAnswer: z.string().optional(),
  marksAwarded: z.number().optional(),
  isCorrect: z.boolean().optional(),
  timeSpent: z.number().optional(),
  order: z.number().int().min(0, 'Order must be non-negative'),
  flagged: z.boolean().optional(),
  meta: z.any().optional(),
});

const createExamTestSchema = z.object({
  testId: z.string().min(1, 'Test ID is required'),
  title: z.string().min(1, 'Title is required'),
  examKey: z.string().optional(),
  syllabus: z.string().optional(),
  totalQuestions: z.number().int().min(0).optional(),
  marks: z.number().min(0).optional(),
  maxNegMarks: z.number().min(0).optional(),
  timeAllotted: z.number().min(0).optional(),
  layout: z.string().optional(),
  allowRandomize: z.boolean().optional(),
  questionPool: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  isPremium: z.boolean().optional(),
  maxAttempt: z.number().int().min(1).optional(),
  percentileId: z.string().optional(),
});

const createExamSessionSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  testId: z.string().min(1, 'Test ID is required'),
  seriesId: z.string().optional(),
  questionOrder: z.array(z.string()).optional(),
  randomSeed: z.string().optional(),
  responses: z.array(questionResponseSchema).optional(),
  ip: z.string().optional(),
  device: z.string().optional(),
  platform: z.string().optional(),
});

const updateExamSessionSchema = z.object({
  responses: z.array(questionResponseSchema).optional(),
  timeSpent: z.number().min(0).optional(),
  lastSeenAt: z.date().optional(),
  status: z.enum(['in_progress', 'submitted', 'evaluated', 'cancelled']).optional(),
});

export const validateCreateExamTest = (data: any) => {
  return createExamTestSchema.safeParse(data);
};

export const validateCreateExamSession = (data: any) => {
  return createExamSessionSchema.safeParse(data);
};

export const validateUpdateExamSession = (data: any) => {
  return updateExamSessionSchema.safeParse(data);
};


