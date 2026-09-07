import { z } from 'zod';

export const userIdSchema = z.object({
  id: z.string().uuid('Invalid id'),
});

export const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long').optional(),
  email: z.string().email('Invalid email').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100, 'Password is too long').optional(),
});