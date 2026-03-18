import { z } from 'zod';
import { CreateJobPostingSchema } from './create-job-posting.dto';

export const UpdateJobPostingSchema = CreateJobPostingSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type UpdateJobPostingDto = z.infer<typeof UpdateJobPostingSchema>;
