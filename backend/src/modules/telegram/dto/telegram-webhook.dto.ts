import { z } from 'zod';

export const TelegramUserSchema = z.object({
  id: z.number(),
  is_bot: z.boolean().optional(),
  first_name: z.string(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  language_code: z.string().optional(),
});

export type TelegramUser = z.infer<typeof TelegramUserSchema>;

export const TelegramChatSchema = z.object({
  id: z.number(),
  type: z.enum(['private', 'group', 'supergroup', 'channel']),
  title: z.string().optional(),
  username: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
});

export type TelegramChat = z.infer<typeof TelegramChatSchema>;

export const TelegramLocationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

export type TelegramLocation = z.infer<typeof TelegramLocationSchema>;

export const TelegramMessageSchema = z.object({
  message_id: z.number(),
  from: TelegramUserSchema.optional(),
  chat: TelegramChatSchema,
  date: z.number(),
  text: z.string().optional(),
  location: TelegramLocationSchema.optional(),
});

export type TelegramMessage = z.infer<typeof TelegramMessageSchema>;

export const TelegramWebhookSchema = z.object({
  update_id: z.number(),
  message: TelegramMessageSchema.optional(),
});

export type TelegramWebhookDto = z.infer<typeof TelegramWebhookSchema>;

export const TelegramInitDataSchema = z.object({
  initData: z.string().min(1),
});

export type TelegramInitDataDto = z.infer<typeof TelegramInitDataSchema>;
