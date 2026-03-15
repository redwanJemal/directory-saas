import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
  tenantSlug: z.string().min(1, 'Business ID is required').regex(/^[a-z0-9-]+$/, 'Invalid Business ID format'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
