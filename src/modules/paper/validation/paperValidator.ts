import { z } from "zod";

const examScheduleSchema = z.object({
  date: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'date must be "dd/mm/yyyy"').optional(),
  timing: z.string().min(1).optional(),
  duration: z.string().min(1).optional(),
});

const paperSchema = z.object({
  boardId: z.string().min(1, "Board ID is required"),
  examId: z.string().min(1, "Exam ID is required"),
  name: z.string().min(1, "Name is required and cannot be empty"),
  year: z.number().int().min(1900).max(3000, "Year must be a valid year"),
  shift: z.string().optional(),
  examSchedule: examScheduleSchema.optional(),
});

export const validatePaper = (data: any) => {
  return paperSchema.safeParse(data);
};

const updatePaperSchema = z.object({
  boardId: z.string().min(1).optional(),
  examId: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  year: z.number().int().min(1900).max(3000).optional(),
  shift: z.string().optional(),
  questionCount: z.number().int().nonnegative().optional(),
  examSchedule: examScheduleSchema.optional(),
});

export const validatePaperUpdate = (data: any) => {
  return updatePaperSchema.safeParse(data);
};

const paperItemSchema = z.object({
  name: z.string().min(1, "name is required"),
  exam: z.string().min(1, "exam is required"),

  date: z
    .string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'date must be "dd/mm/yyyy"')
    .optional(),

  time: z.string().optional(),
  duration: z.string().optional(),
  shift: z.string().optional(),

  questions: z.array(z.any()).optional(),
});

export const bulkPaperUploadSchema = z.array(paperItemSchema);

export const validateBulkPaperUpload = (data: any) => {
  return bulkPaperUploadSchema.safeParse(data);
};