import { z } from 'zod';

export const createRoleSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  description: z.string().max(200).optional(),
  permissions: z.array(z.string()).min(1, 'At least one permission required'),
  tenantId: z.string().uuid().optional(),
});

export const updateRoleSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50).optional(),
  description: z.string().max(200).optional(),
  permissions: z.array(z.string()).min(1, 'At least one permission required').optional(),
});

export type CreateRoleFormData = z.infer<typeof createRoleSchema>;
export type UpdateRoleFormData = z.infer<typeof updateRoleSchema>;
