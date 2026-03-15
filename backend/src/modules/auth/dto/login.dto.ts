import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type LoginDto = z.infer<typeof LoginSchema>;

export const TenantLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  tenantSlug: z.string().min(2).max(50),
});

export type TenantLoginDto = z.infer<typeof TenantLoginSchema>;
