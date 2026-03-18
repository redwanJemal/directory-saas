import { z } from 'zod';

export const createDealSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().max(500).optional().or(z.literal('')),
  discountPercent: z.number().int().min(1).max(99).optional().nullable(),
  originalPrice: z.number().positive().optional().nullable(),
  dealPrice: z.number().positive().optional().nullable(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  startsAt: z.string().optional().or(z.literal('')),
  expiresAt: z.string().optional().or(z.literal('')),
});

export type CreateDealFormData = z.infer<typeof createDealSchema>;
