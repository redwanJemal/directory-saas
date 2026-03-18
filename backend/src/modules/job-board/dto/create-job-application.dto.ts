import { z } from 'zod';

export const CreateJobApplicationSchema = z.object({
  applicantName: z.string().min(2).max(100),
  phone: z.string().max(30).optional(),
  email: z.string().email().optional(),
  message: z.string().max(2000).optional(),
  resumeUrl: z.string().url().optional(),
});

export type CreateJobApplicationDto = z.infer<typeof CreateJobApplicationSchema>;
