import { z } from 'zod';

export const AssignRolesSchema = z.object({
  roleIds: z.array(z.string().uuid()).min(0),
});

export type AssignRolesDto = z.infer<typeof AssignRolesSchema>;
