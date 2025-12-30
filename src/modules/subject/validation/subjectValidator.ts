import { z } from 'zod';
import { i18nStringSchema } from '../../board/validation/boardValidator';

const subjectSchema = z.object({
  boardId: z.string().min(1, 'Board ID is required'),
  examId: z.string().min(1, 'Exam ID is required'),
  name: i18nStringSchema,
});

export const validateSubject = (data: any) => {
  return subjectSchema.safeParse(data);
};

const updateSubjectSchema = z.object({
  boardId: z.string().min(1, 'Board ID is required').optional(),
  examId: z.string().min(1, 'Exam ID is required').optional(),
  name: i18nStringSchema,
});

export const validateSubjectUpdate = (data: any) => {
  return updateSubjectSchema.safeParse(data);
};

