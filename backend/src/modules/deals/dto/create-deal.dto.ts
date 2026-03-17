import { z } from 'zod';

export const CreateDealSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  discountPercent: z.number().int().min(1).max(99).optional(),
  originalPrice: z.number().positive().optional(),
  dealPrice: z.number().positive().optional(),
  imageUrl: z.string().url().optional(),
  startsAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
});

export type CreateDealDto = z.infer<typeof CreateDealSchema>;
