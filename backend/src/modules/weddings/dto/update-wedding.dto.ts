import { z } from 'zod';

export const UpdateWeddingSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  date: z.string().datetime().optional(),
  venue: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  guestCountEstimate: z.number().int().min(0).optional(),
  totalBudget: z.number().min(0).optional(),
  currency: z.string().length(3).optional(),
  settings: z.record(z.unknown()).optional(),
});

export type UpdateWeddingDto = z.infer<typeof UpdateWeddingSchema>;
