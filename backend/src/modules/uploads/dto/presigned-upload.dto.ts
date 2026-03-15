import { z } from 'zod';

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
] as const;

export const ALLOWED_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const PresignedUploadSchema = z.object({
  folder: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Folder must be alphanumeric with dashes/underscores'),
  filename: z
    .string()
    .min(1)
    .max(255),
  contentType: z
    .string()
    .refine(
      (val) => (ALLOWED_MIME_TYPES as readonly string[]).includes(val),
      'File type not allowed',
    ),
});

export type PresignedUploadDto = z.infer<typeof PresignedUploadSchema>;
