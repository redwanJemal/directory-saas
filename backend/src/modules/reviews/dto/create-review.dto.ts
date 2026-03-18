import { z } from 'zod';

export const CreateReviewSchema = z.object({
  providerId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(2).max(200).optional(),
  comment: z.string().min(5).max(2000).optional(),
});

export type CreateReviewDto = z.infer<typeof CreateReviewSchema>;
