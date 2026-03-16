import { z } from 'zod';

export const CreateChecklistTaskSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(2000).optional(),
  dueDate: z.string().datetime().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).optional(),
  category: z.string().max(100).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export type CreateChecklistTaskDto = z.infer<typeof CreateChecklistTaskSchema>;
