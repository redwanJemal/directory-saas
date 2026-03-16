import { z } from 'zod';

export const CreateGuestSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().optional(),
  phone: z.string().max(30).optional(),
  group: z.string().max(100).optional(),
  side: z.string().max(50).optional(),
  rsvpStatus: z.enum(['PENDING', 'ACCEPTED', 'DECLINED', 'MAYBE']).optional(),
  plusOne: z.boolean().optional(),
  dietaryNotes: z.string().max(500).optional(),
  tableNumber: z.number().int().min(0).optional(),
  notes: z.string().max(2000).optional(),
});

export type CreateGuestDto = z.infer<typeof CreateGuestSchema>;
