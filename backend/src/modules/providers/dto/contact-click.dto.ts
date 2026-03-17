import { z } from 'zod';

export const CONTACT_CLICK_TYPES = [
  'whatsapp',
  'phone',
  'email',
  'website',
  'instagram',
] as const;

export type ContactClickType = (typeof CONTACT_CLICK_TYPES)[number];

export const RecordContactClickSchema = z.object({
  type: z.enum(CONTACT_CLICK_TYPES),
});

export type RecordContactClickDto = z.infer<typeof RecordContactClickSchema>;
