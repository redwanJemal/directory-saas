import { z } from 'zod';

export const InviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  roleId: z.string().min(1, 'Role is required'),
});

export type InviteMemberDto = z.infer<typeof InviteMemberSchema>;

export const ChangeRoleSchema = z.object({
  roleId: z.string().min(1, 'Role is required'),
});

export type ChangeRoleDto = z.infer<typeof ChangeRoleSchema>;
