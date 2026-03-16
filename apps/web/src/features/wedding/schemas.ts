import { z } from 'zod';

export const UpdateWeddingSchema = z.object({
  title: z.string().min(1).max(200),
  date: z.string().min(1),
  estimatedGuests: z.coerce.number().min(0).optional(),
  venue: z.string().max(200).optional(),
  styles: z.array(z.string()).optional(),
});

export type UpdateWeddingDto = z.infer<typeof UpdateWeddingSchema>;

export const CreateEventSchema = z.object({
  name: z.string().min(1).max(100),
  date: z.string().min(1),
  time: z.string().optional(),
  venue: z.string().max(200).optional(),
  notes: z.string().max(500).optional(),
});

export type CreateEventDto = z.infer<typeof CreateEventSchema>;

export const InviteCollaboratorSchema = z.object({
  email: z.string().email(),
  role: z.enum(['editor', 'viewer']),
});

export type InviteCollaboratorDto = z.infer<typeof InviteCollaboratorSchema>;
