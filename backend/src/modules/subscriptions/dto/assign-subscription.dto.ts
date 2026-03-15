import { z } from 'zod';

export const AssignSubscriptionSchema = z.object({
  planId: z.string().uuid(),
  status: z.enum(['ACTIVE', 'PAST_DUE', 'CANCELLED', 'TRIAL']).default('ACTIVE'),
  startedAt: z.coerce.date().optional(),
  renewsAt: z.coerce.date().optional(),
});

export type AssignSubscriptionDto = z.infer<typeof AssignSubscriptionSchema>;
