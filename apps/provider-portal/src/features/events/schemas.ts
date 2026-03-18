import { z } from 'zod';

export const createEventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().max(2000).optional().or(z.literal('')),
  date: z.string().min(1, 'Date is required'),
  time: z.string().optional().or(z.literal('')),
  location: z.string().max(300).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  country: z.string().max(100).optional().or(z.literal('')),
  imageUrl: z.string().url().optional().or(z.literal('')),
  maxAttendees: z.number().int().positive().optional().nullable(),
  eventType: z.enum(['business', 'community']).default('business'),
});

export type CreateEventFormData = z.infer<typeof createEventSchema>;
