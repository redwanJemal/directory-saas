import { z } from 'zod';

export const SetPermissionsSchema = z.object({
  permissionIds: z.array(z.string().uuid()).min(0),
});

export type SetPermissionsDto = z.infer<typeof SetPermissionsSchema>;
