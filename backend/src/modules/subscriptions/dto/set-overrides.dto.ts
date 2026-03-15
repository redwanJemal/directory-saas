import { z } from 'zod';

export const SetOverridesSchema = z.object({
  maxUsers: z.number().int().min(-1).optional(),
  maxStorage: z.number().int().min(-1).optional(),
  features: z.array(z.string()).optional(),
});

export type SetOverridesDto = z.infer<typeof SetOverridesSchema>;
