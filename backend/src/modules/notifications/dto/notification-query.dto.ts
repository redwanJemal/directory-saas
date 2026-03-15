import { z } from 'zod';

export const NotificationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  read: z.enum(['true', 'false']).optional(),
  type: z.enum(['info', 'warning', 'success', 'error']).optional(),
});

export type NotificationQueryDto = z.infer<typeof NotificationQuerySchema>;
