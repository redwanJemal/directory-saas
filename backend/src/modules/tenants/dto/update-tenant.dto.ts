import { z } from 'zod';

export const UpdateTenantSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  slug: z
    .string()
    .min(2)
    .max(63)
    .regex(/^[a-z0-9-]+$/, 'Must be lowercase alphanumeric with hyphens')
    .optional(),
  domain: z.string().max(255).nullable().optional(),
  logoUrl: z.string().url().nullable().optional(),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color')
    .nullable()
    .optional(),
  secondaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color')
    .nullable()
    .optional(),
  settings: z.record(z.unknown()).optional(),
});

export type UpdateTenantDto = z.infer<typeof UpdateTenantSchema>;
