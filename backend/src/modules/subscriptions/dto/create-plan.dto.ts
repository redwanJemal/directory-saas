import { z } from 'zod';

export const CreatePlanSchema = z.object({
  name: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Must be lowercase alphanumeric with hyphens'),
  displayName: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  priceMonthly: z.number().min(0),
  priceYearly: z.number().min(0),
  maxUsers: z.number().int().min(-1),
  maxStorage: z.number().int().min(-1),
  features: z.array(z.string()).default([]),
  sortOrder: z.number().int().min(0).default(0),
});

export type CreatePlanDto = z.infer<typeof CreatePlanSchema>;
