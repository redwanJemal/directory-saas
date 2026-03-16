import { z } from 'zod';

export const CreateTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional().or(z.literal('')),
  dueDate: z.string().min(1),
  assignedTo: z.string().optional().or(z.literal('')),
  category: z.string().optional().or(z.literal('')),
});

export type CreateTaskDto = z.infer<typeof CreateTaskSchema>;
