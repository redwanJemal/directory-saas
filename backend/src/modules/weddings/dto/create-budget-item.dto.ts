import { z } from 'zod';

export const CreateBudgetItemSchema = z.object({
  category: z.string().min(1).max(100),
  description: z.string().min(1).max(200),
  estimatedCost: z.number().min(0),
  actualCost: z.number().min(0).optional(),
  isPaid: z.boolean().optional(),
  paidDate: z.string().datetime().optional().nullable(),
  vendor: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
});

export type CreateBudgetItemDto = z.infer<typeof CreateBudgetItemSchema>;
