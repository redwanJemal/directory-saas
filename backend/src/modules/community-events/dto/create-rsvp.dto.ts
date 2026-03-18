import { z } from 'zod';

export const CreateRsvpSchema = z.object({
  status: z.enum(['going', 'interested', 'not-going']).default('going'),
});

export type CreateRsvpDto = z.infer<typeof CreateRsvpSchema>;
