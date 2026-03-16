import { z } from 'zod';

export const SendQuoteSchema = z.object({
  quotedPrice: z.number().min(0),
  quoteMessage: z.string().min(1).max(2000),
});

export type SendQuoteDto = z.infer<typeof SendQuoteSchema>;
