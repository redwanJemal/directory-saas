import { z } from 'zod';

export const UpdateWeddingSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  brideName: z.string().max(200).optional().nullable(),
  groomName: z.string().max(200).optional().nullable(),
  weddingDate: z.string().datetime().optional().nullable(),
  venue: z.string().max(200).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  guestCount: z.number().int().min(0).optional().nullable(),
  budget: z.number().min(0).optional().nullable(),
  currency: z.string().length(3).optional(),
  coverImageUrl: z.string().url().optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
});

export type UpdateWeddingDto = z.infer<typeof UpdateWeddingSchema>;
