import { z } from 'zod';

export const ReviewVerificationSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  adminNotes: z.string().max(1000).optional(),
});

export type ReviewVerificationDto = z.infer<typeof ReviewVerificationSchema>;
