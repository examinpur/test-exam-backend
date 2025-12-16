import { z } from 'zod';

const userProfileSchema = z.object({
  firstName: z
    .string()
    .min(1, 'Name cannot be empty'),
  lastName: z
    .string()
    .min(1, 'Last Name cannot be empty'),
  email: z
    .string()
    .email('Invalid email address'),
  phone: z
    .string()
    .regex(/^[0-9]{9,10}$/, 'Phone number must contain 9-10 digits'),
  password: z
    .string()
    .min(8, 'Password must be 8 digits minimum'),
  role: z
    .enum(['business', 'staff'], 'Role is required, and it should be either business or staff' ),
});

export const validateUserProfile = (data: any) => {
  return userProfileSchema.safeParse(data);
};

const updateUserProfileSchema = z.object({
  firstName: z
    .string()
    .min(1, 'Name cannot be empty')
    .optional(),
  lastName: z
    .string()
    .min(1, 'Last Name cannot be empty')
    .optional(),
  email: z
    .string()
    .email('Invalid email address')
    .optional(),
  phone: z
    .string()
    .regex(/^[0-9]{9,10}$/, 'Phone number must contain 9-10 digits')
    .optional(),
});

export const validateUserProfileUpdate = (data: any) => {
  return updateUserProfileSchema.safeParse(data);
};

const emailPasswordSchema = z.object({
  email: z
    .string()
    .email('Invalid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long'),
});

export const validateEmailAndPassword = (data: any) => {
  return emailPasswordSchema.safeParse(data);
};
