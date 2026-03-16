import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('auth.emailRequired'),
  password: z.string().min(1, 'auth.passwordRequired'),
});
export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z.string().min(2, 'auth.nameRequired'),
    email: z.string().email('auth.emailRequired'),
    password: z.string().min(8, 'auth.passwordMinLength'),
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, { error: 'auth.termsAgree' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'auth.passwordsDoNotMatch',
    path: ['confirmPassword'],
  });
export type RegisterFormData = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email('auth.emailRequired'),
});
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
