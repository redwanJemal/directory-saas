import { z } from 'zod';

const BusinessHoursSchema = z.record(
  z.object({
    open: z.string().regex(/^\d{2}:\d{2}$/),
    close: z.string().regex(/^\d{2}:\d{2}$/),
  }),
).optional();

export const UpdateProfileSchema = z.object({
  bio: z.string().max(2000).optional(),
  description: z.string().max(5000).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional().nullable(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  whatsapp: z.string().max(50).optional().nullable(),
  instagram: z.string().max(100).optional().nullable(),
  tiktok: z.string().max(100).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  coverImageUrl: z.string().url().optional().nullable(),
  galleryUrls: z.array(z.string().url()).optional(),
  socialLinks: z.record(z.string()).optional(),
  businessHours: BusinessHoursSchema,
  metadata: z.record(z.unknown()).optional().nullable(),
});

export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;
