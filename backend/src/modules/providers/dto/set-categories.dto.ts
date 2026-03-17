import { z } from 'zod';

export const SetCategoriesSchema = z
  .object({
    categoryIds: z.array(z.string().uuid()).min(1).max(5),
    primaryCategoryId: z.string().uuid(),
  })
  .refine((data) => data.categoryIds.includes(data.primaryCategoryId), {
    message: 'primaryCategoryId must be included in categoryIds',
    path: ['primaryCategoryId'],
  });

export type SetCategoriesDto = z.infer<typeof SetCategoriesSchema>;
