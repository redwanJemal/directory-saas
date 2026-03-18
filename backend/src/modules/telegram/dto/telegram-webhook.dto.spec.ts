import {
  TelegramWebhookSchema,
  TelegramInitDataSchema,
  TelegramUserSchema,
} from './telegram-webhook.dto';

describe('Telegram DTOs', () => {
  describe('TelegramUserSchema', () => {
    it('should validate a valid user', () => {
      const result = TelegramUserSchema.safeParse({
        id: 123456,
        first_name: 'John',
        last_name: 'Doe',
        username: 'johndoe',
        language_code: 'en',
      });
      expect(result.success).toBe(true);
    });

    it('should require id and first_name', () => {
      const result = TelegramUserSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should accept minimal user', () => {
      const result = TelegramUserSchema.safeParse({
        id: 123,
        first_name: 'Test',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('TelegramWebhookSchema', () => {
    it('should validate a webhook with message', () => {
      const result = TelegramWebhookSchema.safeParse({
        update_id: 1,
        message: {
          message_id: 1,
          chat: { id: 123, type: 'private' },
          date: 1234567890,
          text: '/start',
        },
      });
      expect(result.success).toBe(true);
    });

    it('should validate a webhook without message', () => {
      const result = TelegramWebhookSchema.safeParse({
        update_id: 1,
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing update_id', () => {
      const result = TelegramWebhookSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should validate message with location', () => {
      const result = TelegramWebhookSchema.safeParse({
        update_id: 1,
        message: {
          message_id: 1,
          chat: { id: 123, type: 'private' },
          date: 1234567890,
          location: { latitude: 25.27, longitude: 55.29 },
        },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('TelegramInitDataSchema', () => {
    it('should validate valid initData', () => {
      const result = TelegramInitDataSchema.safeParse({
        initData: 'query_id=test&user=%7B%7D&hash=abc123',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty initData', () => {
      const result = TelegramInitDataSchema.safeParse({
        initData: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing initData', () => {
      const result = TelegramInitDataSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
