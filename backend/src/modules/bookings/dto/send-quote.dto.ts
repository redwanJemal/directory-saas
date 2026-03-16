import { z } from 'zod';

export const SendQuoteSchema = z.object({
  totalAmount: z.number().min(0),
  notes: z.string().max(2000).optional(),
});

export type SendQuoteDto = z.infer<typeof SendQuoteSchema>;
