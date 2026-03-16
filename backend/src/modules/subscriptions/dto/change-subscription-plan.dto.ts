import { z } from 'zod';

export const ChangeSubscriptionPlanSchema = z.object({
  planId: z.string().uuid(),
});

export type ChangeSubscriptionPlanDto = z.infer<typeof ChangeSubscriptionPlanSchema>;
