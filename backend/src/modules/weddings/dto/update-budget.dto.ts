import { z } from 'zod';

export const UpdateBudgetSchema = z.object({
  totalBudget: z.number().min(0),
  currency: z.string().length(3).optional(),
});

export type UpdateBudgetDto = z.infer<typeof UpdateBudgetSchema>;
