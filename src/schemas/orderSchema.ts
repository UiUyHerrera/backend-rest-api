import { z } from 'zod';

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid('Invalid product id'),
        quantity: z.number().int('Quantity must be a whole number').min(1, 'Quantity must be at least 1'),
      })
    )
    .min(1, 'Order must have at least one item')
    .max(50, 'Too many items in one order'),
});

export const orderIdSchema = z.object({
  id: z.string().uuid('Invalid id'),
});

export const orderListSchema = z.object({
  page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(10),
});