import { z } from 'zod';

export const CreateRoleSchema = z.object({
  name: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[A-Z][A-Z0-9_]*$/, 'Name must be UPPER_SNAKE_CASE'),
  displayName: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
});

export type CreateRoleDto = z.infer<typeof CreateRoleSchema>;
