import { z } from 'zod';

export const CreateJobPostingSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(5000).optional(),
  type: z.enum(['full-time', 'part-time', 'freelance']).default('full-time'),
  salaryMin: z.number().positive().optional(),
  salaryMax: z.number().positive().optional(),
  salaryCurrency: z.string().max(10).default('AED'),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  expiresAt: z.string().datetime().optional(),
});

export type CreateJobPostingDto = z.infer<typeof CreateJobPostingSchema>;
