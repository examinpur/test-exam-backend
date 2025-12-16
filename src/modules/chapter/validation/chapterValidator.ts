import { z } from 'zod';

const chapterSchema = z.object({
  boardId: z.string().min(1, 'Board ID is required'),
  examId: z.string().min(1, 'Exam ID is required'),
  subjectId: z.string().min(1, 'Subject ID is required'),
  chapterGroupId: z.string().min(1, 'Chapter Group ID is required'),
  name: z.string().min(1, 'Name is required and cannot be empty'),
});

export const validateChapter = (data: any) => {
  return chapterSchema.safeParse(data);
};

const updateChapterSchema = z.object({
  boardId: z.string().min(1, 'Board ID is required').optional(),
  examId: z.string().min(1, 'Exam ID is required').optional(),
  subjectId: z.string().min(1, 'Subject ID is required').optional(),
  chapterGroupId: z.string().min(1, 'Chapter Group ID is required').optional(),
  name: z.string().min(1, 'Name is required and cannot be empty').optional(),
});

export const validateChapterUpdate = (data: any) => {
  return updateChapterSchema.safeParse(data);
};
