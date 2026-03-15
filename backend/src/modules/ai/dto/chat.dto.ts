import { z } from 'zod';

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(10000),
});

export const ChatRequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(100),
  conversationId: z.string().uuid().optional(),
});

export type ChatRequestDto = z.infer<typeof ChatRequestSchema>;

export const CreateConversationSchema = z.object({
  title: z.string().min(1).max(200).optional(),
});

export type CreateConversationDto = z.infer<typeof CreateConversationSchema>;
