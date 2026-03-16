import { z } from 'zod';

export const CreateEventSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  eventDate: z.string().datetime().optional(),
  startTime: z.string().max(10).optional(),
  endTime: z.string().max(10).optional(),
  venue: z.string().max(300).optional(),
  address: z.string().max(500).optional(),
  sortOrder: z.number().int().min(0).optional(),
  metadata: z.record(z.unknown()).optional().nullable(),
});

export type CreateEventDto = z.infer<typeof CreateEventSchema>;
