import { z } from 'zod';

export const InviteUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  roleId: z.string().uuid().optional(),
});
export type InviteUserDto = z.infer<typeof InviteUserSchema>;

export const ChangeRoleSchema = z.object({
  roleId: z.string().uuid(),
});
export type ChangeRoleDto = z.infer<typeof ChangeRoleSchema>;
