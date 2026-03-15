import { z } from 'zod';

export const createTenantSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  slug: z
    .string()
    .regex(
      /^[a-z0-9-]+$/,
      'Slug must be lowercase letters, numbers, and hyphens only',
    )
    .min(2)
    .max(50),
  ownerEmail: z.string().email('Invalid email address'),
  planId: z.string().uuid().optional(),
});

export const updateTenantSchema = z.object({
  name: z.string().min(2).max(100).optional(),
});

export const suspendTenantSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(500),
});

export type CreateTenantFormData = z.infer<typeof createTenantSchema>;
export type UpdateTenantFormData = z.infer<typeof updateTenantSchema>;
export type SuspendTenantFormData = z.infer<typeof suspendTenantSchema>;
