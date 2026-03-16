import { z } from 'zod';

export const CreatePortfolioItemSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  imageUrl: z.string().url().optional().nullable(),
  videoUrl: z.string().url().optional().nullable(),
  tags: z.array(z.string()).default([]),
  sortOrder: z.number().int().min(0).default(0),
});

export type CreatePortfolioItemDto = z.infer<typeof CreatePortfolioItemSchema>;

export const UpdatePortfolioItemSchema = CreatePortfolioItemSchema.partial();

export type UpdatePortfolioItemDto = z.infer<typeof UpdatePortfolioItemSchema>;
