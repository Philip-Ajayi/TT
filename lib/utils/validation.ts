import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email('Provide a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8),
  token: z.string(),
});

export const currencySchema = z.object({
  code: z.string().length(3),
  multiplier: z.number().positive(),
});

export const clothSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  basePrice: z.number().optional(),
});

export const deliverySchema = z.object({
  quantityRange: z.string(),
  multiplier: z.number(),
  pricePerMile: z.number(),
});

export const discountSchema = z.object({
  code: z.string(),
  type: z.enum(['cart', 'services', 'delivery']),
  percentage: z.number().min(0).max(100),
  capNaira: z.number().optional(),
});

export const processingSchema = z.object({
  name: z.string(),
  multiplier: z.number(),
});