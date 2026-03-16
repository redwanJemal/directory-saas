import { z } from 'zod';

export const CreateGuestSchema = z.object({
  firstName: z.string().min(1).max(200),
  lastName: z.string().min(1).max(200),
  email: z.string().email().optional(),
  phone: z.string().max(30).optional(),
  group: z.string().max(100).optional(),
  rsvpStatus: z.enum(['PENDING', 'ACCEPTED', 'DECLINED', 'MAYBE']).optional(),
  plusOnes: z.number().int().min(0).optional(),
  dietaryNotes: z.string().max(500).optional(),
  tableNumber: z.string().max(50).optional(),
  metadata: z.record(z.unknown()).optional().nullable(),
});

export type CreateGuestDto = z.infer<typeof CreateGuestSchema>;
