import { z } from 'zod';
import { i18nStringSchema } from '../../board/validation/boardValidator';

const chapterGroupSchema = z.object({
  boardId: z.string().min(1, 'Board ID is required'),
  examId: z.string().min(1, 'Exam ID is required'),
  subjectId: z.string().min(1, 'Subject ID is required'),
  name: i18nStringSchema,
});

export const validateChapterGroup = (data: any) => {
  return chapterGroupSchema.safeParse(data);
};

const updateChapterGroupSchema = z.object({
  boardId: z.string().min(1, 'Board ID is required').optional(),
  examId: z.string().min(1, 'Exam ID is required').optional(),
  subjectId: z.string().min(1, 'Subject ID is required').optional(),
  name: i18nStringSchema.optional(),
});

export const validateChapterGroupUpdate = (data: any) => {
  return updateChapterGroupSchema.safeParse(data);
};

