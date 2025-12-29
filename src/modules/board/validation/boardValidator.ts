import { z } from "zod";

export const i18nStringSchema = z.union([
  z.string().min(1, "Name is required and cannot be empty"),
  z.object({
    en: z.string().min(1, "English name is required"),
    hi: z.string().min(1).optional(),
  }),
]);

const boardSchema = z.object({
  name: i18nStringSchema,
});

export const validateBoard = (data: any) => boardSchema.safeParse(data);
