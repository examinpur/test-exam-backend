import { z } from 'zod';

const subjectSchema = z.object({
  boardId: z.string().min(1, 'Board ID is required'),
  examId: z.string().min(1, 'Exam ID is required'),
  name: z.string().min(1, 'Name is required and cannot be empty'),
});

export const validateSubject = (data: any) => {
  return subjectSchema.safeParse(data);
};

const updateSubjectSchema = z.object({
  boardId: z.string().min(1, 'Board ID is required').optional(),
  examId: z.string().min(1, 'Exam ID is required').optional(),
  name: z.string().min(1, 'Name is required and cannot be empty').optional(),
});

export const validateSubjectUpdate = (data: any) => {
  return updateSubjectSchema.safeParse(data);
};

