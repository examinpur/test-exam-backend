import { z } from 'zod';

const paperSchema = z.object({
  boardId: z.string().min(1, 'Board ID is required'),
  examId: z.string().min(1, 'Exam ID is required'),
  name: z.string().min(1, 'Name is required and cannot be empty'),
  year: z.number().int().min(1900).max(3000, 'Year must be a valid year'),
  paperNumber: z.number().int().positive().optional(),
  shift: z.string().optional(),
});

export const validatePaper = (data: any) => {
  return paperSchema.safeParse(data);
};

const updatePaperSchema = z.object({
  boardId: z.string().min(1, 'Board ID is required').optional(),
  examId: z.string().min(1, 'Exam ID is required').optional(),
  name: z.string().min(1, 'Name is required and cannot be empty').optional(),
  year: z.number().int().min(1900).max(3000, 'Year must be a valid year').optional(),
  paperNumber: z.number().int().positive().optional(),
  shift: z.string().optional(),
  questionPathKeys: z.array(z.string()).optional(),
  questionCount: z.number().int().nonnegative().optional(),
});

export const validatePaperUpdate = (data: any) => {
  return updatePaperSchema.safeParse(data);
};

