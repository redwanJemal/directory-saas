import { z } from 'zod';

export const SendQuoteSchema = z.object({
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  description: z.string().min(1, 'Description is required').max(2000),
  validUntil: z.string().min(1, 'Valid until date is required'),
  notes: z.string().max(1000).optional(),
});

export type SendQuoteDto = z.infer<typeof SendQuoteSchema>;

export const UpdateStatusSchema = z.object({
  status: z.enum(['inquiry', 'quoted', 'booked', 'active', 'completed', 'cancelled']),
  notes: z.string().max(1000).optional(),
});

export type UpdateStatusDto = z.infer<typeof UpdateStatusSchema>;
