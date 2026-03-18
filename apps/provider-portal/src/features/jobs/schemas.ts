import { z } from 'zod';

export const createJobSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().max(5000).optional().or(z.literal('')),
  type: z.enum(['full-time', 'part-time', 'freelance']).default('full-time'),
  salaryMin: z.number().positive().optional().nullable(),
  salaryMax: z.number().positive().optional().nullable(),
  salaryCurrency: z.string().max(10).default('AED'),
  city: z.string().max(100).optional().or(z.literal('')),
  country: z.string().max(100).optional().or(z.literal('')),
  expiresAt: z.string().optional().or(z.literal('')),
});

export type CreateJobFormData = z.infer<typeof createJobSchema>;
