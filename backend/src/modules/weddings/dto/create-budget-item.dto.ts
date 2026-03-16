import { z } from 'zod';

export const CreateBudgetItemSchema = z.object({
  category: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  estimatedCost: z.number().min(0).optional(),
  actualCost: z.number().min(0).optional(),
  paidAmount: z.number().min(0).optional(),
  vendor: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
});

export type CreateBudgetItemDto = z.infer<typeof CreateBudgetItemSchema>;
