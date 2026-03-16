import { z } from 'zod';

export const InviteCollaboratorSchema = z.object({
  userId: z.string().uuid(),
  userType: z.string().min(1).max(50),
  role: z.enum(['VIEWER', 'EDITOR']).optional(),
});

export type InviteCollaboratorDto = z.infer<typeof InviteCollaboratorSchema>;
