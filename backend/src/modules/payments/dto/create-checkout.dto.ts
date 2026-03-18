import { z } from 'zod';

export const CreateCheckoutSchema = z.object({
  planId: z.string().uuid(),
  interval: z.enum(['monthly', 'yearly']),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export type CreateCheckoutDto = z.infer<typeof CreateCheckoutSchema>;
