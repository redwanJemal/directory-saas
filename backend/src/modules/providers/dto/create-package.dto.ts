import { z } from 'zod';

export const CreatePackageSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  price: z.number().min(0),
  currency: z.string().length(3).default('ETB'),
  features: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});

export type CreatePackageDto = z.infer<typeof CreatePackageSchema>;

export const UpdatePackageSchema = CreatePackageSchema.partial();

export type UpdatePackageDto = z.infer<typeof UpdatePackageSchema>;
