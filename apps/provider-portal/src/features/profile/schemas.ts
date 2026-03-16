import { z } from 'zod';

export const profileSchema = z.object({
  businessName: z.string().min(2, 'Business name is required').max(100),
  description: z.string().max(2000).optional(),
  category: z.string().min(1, 'Category is required'),
  location: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  styles: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
});

export const packageSchema = z.object({
  name: z.string().min(1, 'Package name is required').max(100),
  description: z.string().max(1000).optional(),
  price: z.number().min(0, 'Price must be positive'),
  priceType: z.enum(['fixed', 'starting_from', 'hourly', 'custom']),
  duration: z.string().max(100).optional(),
  inclusions: z.array(z.string()),
});

export const faqSchema = z.object({
  question: z.string().min(1, 'Question is required').max(500),
  answer: z.string().min(1, 'Answer is required').max(2000),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
export type PackageFormData = z.infer<typeof packageSchema>;
export type FAQFormData = z.infer<typeof faqSchema>;
