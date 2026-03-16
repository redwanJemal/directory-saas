import { z } from 'zod';

export const AvailabilityEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  isAvailable: z.boolean(),
  note: z.string().max(500).optional().nullable(),
});

export const UpdateAvailabilitySchema = z.object({
  entries: z.array(AvailabilityEntrySchema).min(1).max(365),
});

export type UpdateAvailabilityDto = z.infer<typeof UpdateAvailabilitySchema>;
