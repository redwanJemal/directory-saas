import { z } from 'zod';

export const CreateGuestSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  group: z.string().min(1),
  side: z.string().min(1),
  events: z.array(z.string()).optional(),
  dietaryNotes: z.string().max(500).optional().or(z.literal('')),
});

export type CreateGuestDto = z.infer<typeof CreateGuestSchema>;
