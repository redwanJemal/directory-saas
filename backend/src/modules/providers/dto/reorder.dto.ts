import { z } from 'zod';

export const ReorderItemSchema = z.object({
  id: z.string().uuid(),
  sortOrder: z.number().int().min(0),
});

export const ReorderSchema = z.object({
  items: z.array(ReorderItemSchema).min(1).max(100),
});

export type ReorderDto = z.infer<typeof ReorderSchema>;
