import { z } from 'zod';

export const InviteCollaboratorSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(200),
  role: z.enum(['VIEWER', 'EDITOR', 'ADMIN']).optional(),
});

export type InviteCollaboratorDto = z.infer<typeof InviteCollaboratorSchema>;
