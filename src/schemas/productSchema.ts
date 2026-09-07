import { z } from 'zod';

const productFields = {
  name: z.string().min(2, 'Name must be at least 2 characters').max(200, 'Name is too long'),
  description: z.string().max(2000, 'Description is too long').optional(),
  price: z.number().positive('Price must be positive'),
  stock: z.number().int('Stock must be a whole number').min(0, 'Stock cannot be negative'),
};

export const createProductSchema = z.object(productFields);

export const updateProductSchema = z.object(productFields).partial();

export const productIdSchema = z.object({
  id: z.string().uuid('Invalid id'),
});

export const productListSchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(10),
  minPrice: z.coerce.number().positive('Min price must be positive').optional(),
  maxPrice: z.coerce.number().positive('Max price must be positive').optional(),
  sort: z.enum(['name', 'price', 'createdAt', 'updatedAt']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});