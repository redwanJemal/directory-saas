import { z } from 'zod';

export const UpdateStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']),
});

export type UpdateStatusDto = z.infer<typeof UpdateStatusSchema>;
