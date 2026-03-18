import { z } from 'zod';

export const CreateCommunityEventSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
  time: z.string().max(20).optional(),
  location: z.string().max(300).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  imageUrl: z.string().url().optional(),
  maxAttendees: z.number().int().positive().optional(),
  eventType: z.enum(['business', 'community']).default('business'),
});

export type CreateCommunityEventDto = z.infer<typeof CreateCommunityEventSchema>;
