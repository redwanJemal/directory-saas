import { z } from 'zod';

export const CreateNotificationSchema = z.object({
  tenantId: z.string().uuid().optional(),
  userId: z.string().uuid(),
  userType: z.enum(['AdminUser', 'TenantUser', 'ClientUser']),
  type: z.enum(['info', 'warning', 'success', 'error']),
  title: z.string().min(1).max(255),
  message: z.string().min(1).max(2000),
  data: z.record(z.unknown()).optional(),
});

export type CreateNotificationDto = z.infer<typeof CreateNotificationSchema>;
