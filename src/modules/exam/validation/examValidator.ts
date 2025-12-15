import { z } from 'zod';

const examSchema = z.object({
  boardId: z.string().min(1, 'Board ID is required'),
  name: z.string().min(1, 'Name is required and cannot be empty'),
});

export const validateExam = (data: any) => {
  return examSchema.safeParse(data);
};

const updateExamSchema = z.object({
  boardId: z.string().min(1, 'Board ID is required').optional(),
  name: z.string().min(1, 'Name is required and cannot be empty').optional(),
});

export const validateExamUpdate = (data: any) => {
  return updateExamSchema.safeParse(data);
};

