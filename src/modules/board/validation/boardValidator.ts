import { z } from 'zod';

const boardSchema = z.object({
  name: z.string().min(1, 'Name is required and cannot be empty'),
});

export const validateBoard = (data: any) => {
  return boardSchema.safeParse(data);
};

