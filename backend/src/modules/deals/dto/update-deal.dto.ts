import { z } from 'zod';
import { CreateDealSchema } from './create-deal.dto';

export const UpdateDealSchema = CreateDealSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type UpdateDealDto = z.infer<typeof UpdateDealSchema>;
