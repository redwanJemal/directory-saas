import { z } from 'zod';
import { CreatePlanSchema } from './create-plan.dto';

export const UpdatePlanSchema = CreatePlanSchema.partial();

export type UpdatePlanDto = z.infer<typeof UpdatePlanSchema>;
