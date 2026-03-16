import { z } from 'zod';

export const CreateEventSchema = z.object({
  name: z.string().min(1).max(200),
  date: z.string().datetime().optional(),
  startTime: z.string().max(10).optional(),
  endTime: z.string().max(10).optional(),
  location: z.string().max(300).optional(),
  notes: z.string().max(2000).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export type CreateEventDto = z.infer<typeof CreateEventSchema>;
