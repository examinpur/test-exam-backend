import { z } from 'zod';

const questionSchema = z.object({
  boardId: z.string().min(1, 'Board ID is required'),
  examId: z.string().min(1, 'Exam ID is required'),
  subjectId: z.string().min(1, 'Subject ID is required'),
  chapterGroupId: z.string().min(1, 'Chapter Group ID is required'),
  chapterId: z.string().min(1, 'Chapter ID is required'),
  topicId: z.string().optional(),
  comprehensionId: z.string().optional(),
  comprehensionOrder: z.number().optional(),
  kind: z.enum(['MCQ', 'MSQ', 'TRUE_FALSE', 'INTEGER', 'FILL_BLANK', 'COMPREHENSION_PASSAGE']),
  name: z.string().min(1, 'Name/slug is required'),
  marks: z.number().optional(),
  negMarks: z.number().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  calculator: z.boolean().optional(),
  passage: z.any().optional(),
  prompt: z.any().optional(),
  correct: z.any().optional(),
  year: z.number().optional(),
  paperTitle: z.string().optional(),
  paperId: z.string().optional(),
  yearKey: z.string().optional(),
  section: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

export const validateQuestion = (data: any) => {
  return questionSchema.safeParse(data);
};

const updateQuestionSchema = z.object({
  boardId: z.string().min(1, 'Board ID is required').optional(),
  examId: z.string().min(1, 'Exam ID is required').optional(),
  subjectId: z.string().min(1, 'Subject ID is required').optional(),
  chapterGroupId: z.string().min(1, 'Chapter Group ID is required').optional(),
  chapterId: z.string().min(1, 'Chapter ID is required').optional(),
  topicId: z.string().optional(),
  comprehensionId: z.string().optional(),
  comprehensionOrder: z.number().optional(),
  kind: z.enum(['MCQ', 'MSQ', 'TRUE_FALSE', 'INTEGER', 'FILL_BLANK', 'COMPREHENSION_PASSAGE']).optional(),
  name: z.string().min(1, 'Name/slug is required').optional(),
  marks: z.number().optional(),
  negMarks: z.number().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  calculator: z.boolean().optional(),
  passage: z.any().optional(),
  prompt: z.any().optional(),
  correct: z.any().optional(),
  year: z.number().optional(),
  paperTitle: z.string().optional(),
  paperId: z.string().optional(),
  yearKey: z.string().optional(),
  section: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

export const validateQuestionUpdate = (data: any) => {
  return updateQuestionSchema.safeParse(data);
};

