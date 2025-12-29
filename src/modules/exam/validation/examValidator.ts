import { z } from 'zod';
import { i18nStringSchema } from '../../board/validation/boardValidator';

const examSchema = z.object({
  boardId: z.string().min(1, 'Board ID is required'),
  name: i18nStringSchema,
});

export const validateExam = (data: any) => {
  return examSchema.safeParse(data);
};

const updateExamSchema = z.object({
  boardId: z.string().min(1, 'Board ID is required').optional(),
  name: i18nStringSchema,
});

export const validateExamUpdate = (data: any) => {
  return updateExamSchema.safeParse(data);
};

