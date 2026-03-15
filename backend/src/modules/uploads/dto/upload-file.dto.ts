import { z } from 'zod';

export const UploadFileSchema = z.object({
  folder: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Folder must be alphanumeric with dashes/underscores')
    .default('general'),
});

export type UploadFileDto = z.infer<typeof UploadFileSchema>;
