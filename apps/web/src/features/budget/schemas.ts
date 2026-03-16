import { z } from 'zod';

export const CreateBudgetItemSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1).max(200),
  estimated: z.coerce.number().min(0),
  actual: z.coerce.number().min(0).optional(),
  paid: z.coerce.number().min(0).optional(),
  vendor: z.string().max(200).optional().or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal('')),
});

export type CreateBudgetItemDto = z.infer<typeof CreateBudgetItemSchema>;

export const UpdateBudgetSchema = z.object({
  totalBudget: z.coerce.number().min(0),
});

export type UpdateBudgetDto = z.infer<typeof UpdateBudgetSchema>;
