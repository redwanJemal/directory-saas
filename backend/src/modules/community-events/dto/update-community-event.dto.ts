import { z } from 'zod';
import { CreateCommunityEventSchema } from './create-community-event.dto';

export const UpdateCommunityEventSchema = CreateCommunityEventSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type UpdateCommunityEventDto = z.infer<typeof UpdateCommunityEventSchema>;
