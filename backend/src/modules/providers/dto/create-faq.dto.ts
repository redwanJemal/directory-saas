import { z } from 'zod';

export const CreateFaqSchema = z.object({
  question: z.string().min(1).max(500),
  answer: z.string().min(1).max(2000),
  sortOrder: z.number().int().min(0).default(0),
});

export type CreateFaqDto = z.infer<typeof CreateFaqSchema>;

export const UpdateFaqSchema = CreateFaqSchema.partial();

export type UpdateFaqDto = z.infer<typeof UpdateFaqSchema>;
