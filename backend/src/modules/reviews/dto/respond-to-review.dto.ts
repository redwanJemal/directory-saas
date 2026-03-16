import { z } from 'zod';

export const RespondToReviewSchema = z.object({
  response: z.string().min(1).max(2000),
});

export type RespondToReviewDto = z.infer<typeof RespondToReviewSchema>;
