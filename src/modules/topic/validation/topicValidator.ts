import { z } from 'zod';

const topicSchema = z.object({
  boardId: z.string().min(1, 'Board ID is required'),
  examId: z.string().min(1, 'Exam ID is required'),
  subjectId: z.string().min(1, 'Subject ID is required'),
  chapterId: z.string().min(1, 'Chapter ID is required'),
  name: z.string().min(1, 'Name is required and cannot be empty'),
});

export const validateTopic = (data: any) => {
  return topicSchema.safeParse(data);
};

const updateTopicSchema = z.object({
  boardId: z.string().min(1, 'Board ID is required').optional(),
  examId: z.string().min(1, 'Exam ID is required').optional(),
  subjectId: z.string().min(1, 'Subject ID is required').optional(),
  chapterId: z.string().min(1, 'Chapter ID is required').optional(),
  name: z.string().min(1, 'Name is required and cannot be empty').optional(),
});

export const validateTopicUpdate = (data: any) => {
  return updateTopicSchema.safeParse(data);
};

