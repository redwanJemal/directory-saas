import { z } from 'zod';

export const SubmitVerificationSchema = z.object({
  tradeLicenseUrl: z.string().url().optional(),
  documentUrls: z.array(z.string().url()).max(10).default([]),
  notes: z.string().max(1000).optional(),
});

export type SubmitVerificationDto = z.infer<typeof SubmitVerificationSchema>;
