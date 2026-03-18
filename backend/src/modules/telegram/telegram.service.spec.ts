import * as crypto from 'crypto';
import { TelegramService } from './telegram.service';
import { AppConfigService } from '../../config/app-config.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('TelegramService', () => {
  let service: TelegramService;
  let configService: jest.Mocked<AppConfigService>;
  let prismaService: jest.Mocked<PrismaService>;

  const BOT_TOKEN = 'test-bot-token-123:ABC';
  const MINI_APP_URL = 'https://t.me/testbot/app';

  beforeEach(() => {
    configService = {
      telegram: {
        botToken: BOT_TOKEN,
        channelId: '@test_channel',
        miniAppUrl: MINI_APP_URL,
        webhookSecret: 'test-secret',
      },
    } as unknown as jest.Mocked<AppConfigService>;

    prismaService = {
      providerProfile: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      category: {
        findMany: jest.fn(),
      },
      deal: {
        findMany: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaService>;

    service = new TelegramService(configService, prismaService);
  });

  describe('verifyInitData', () => {
    function buildInitData(user: object, botToken: string): string {
      const authDate = Math.floor(Date.now() / 1000);
      const userJson = JSON.stringify(user);
      const params = new URLSearchParams();
      params.set('auth_date', String(authDate));
      params.set('user', userJson);
      params.set('query_id', 'test-query');

      const entries = Array.from(params.entries());
      entries.sort(([a], [b]) => a.localeCompare(b));
      const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join('\n');

      const secretKey = crypto
        .createHmac('sha256', 'WebAppData')
        .update(botToken)
        .digest();

      const hash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');

      params.set('hash', hash);
      return params.toString();
    }

    it('should verify valid initData and return user', () => {
      const user = { id: 123456, first_name: 'Test', username: 'testuser' };
      const initData = buildInitData(user, BOT_TOKEN);

      const result = service.verifyInitData(initData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(user);
    });

    it('should reject initData with invalid hash', () => {
      const user = { id: 123456, first_name: 'Test' };
      const initData = buildInitData(user, 'wrong-token');

      const result = service.verifyInitData(initData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNAUTHORIZED');
    });

    it('should reject initData without hash', () => {
      const params = new URLSearchParams();
      params.set('auth_date', String(Math.floor(Date.now() / 1000)));

      const result = service.verifyInitData(params.toString());

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNAUTHORIZED');
    });

    it('should reject expired initData', () => {
      const user = { id: 123456, first_name: 'Test' };
      // Build with old auth_date
      const oldAuthDate = Math.floor(Date.now() / 1000) - 100000;
      const userJson = JSON.stringify(user);
      const params = new URLSearchParams();
      params.set('auth_date', String(oldAuthDate));
      params.set('user', userJson);

      const entries = Array.from(params.entries());
      entries.sort(([a], [b]) => a.localeCompare(b));
      const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join('\n');

      const secretKey = crypto
        .createHmac('sha256', 'WebAppData')
        .update(BOT_TOKEN)
        .digest();

      const hash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');

      params.set('hash', hash);
      const result = service.verifyInitData(params.toString());

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('TOKEN_EXPIRED');
    });

    it('should reject initData without user', () => {
      const authDate = Math.floor(Date.now() / 1000);
      const params = new URLSearchParams();
      params.set('auth_date', String(authDate));

      const entries = Array.from(params.entries());
      entries.sort(([a], [b]) => a.localeCompare(b));
      const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join('\n');

      const secretKey = crypto
        .createHmac('sha256', 'WebAppData')
        .update(BOT_TOKEN)
        .digest();

      const hash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');

      params.set('hash', hash);
      const result = service.verifyInitData(params.toString());

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNAUTHORIZED');
    });
  });

  describe('handleMessage', () => {
    const baseMessage = {
      message_id: 1,
      chat: { id: 12345, type: 'private' as const },
      date: Math.floor(Date.now() / 1000),
    };

    beforeEach(() => {
      // Mock fetch for Telegram API calls
      global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({ ok: true, result: {} }),
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should handle /start command', async () => {
      await service.handleMessage({ ...baseMessage, text: '/start' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sendMessage'),
        expect.objectContaining({
          method: 'POST',
        }),
      );
    });

    it('should handle /start with deep link', async () => {
      (prismaService.providerProfile.findFirst as jest.Mock).mockResolvedValue({
        id: 'profile-1',
        tenant: { name: 'Test Biz', slug: 'test-biz' },
        bio: 'Great food',
        isVerified: true,
        city: 'Dubai',
        country: 'UAE',
        categories: [{ category: { name: 'Restaurant' } }],
      });

      await service.handleMessage({ ...baseMessage, text: '/start business_test-biz' });

      expect(prismaService.providerProfile.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenant: { slug: 'test-biz', deletedAt: null } },
        }),
      );
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should handle /search command with query', async () => {
      (prismaService.providerProfile.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'p1',
          tenant: { name: 'Ethiopian Kitchen', slug: 'eth-kitchen' },
          isVerified: true,
          city: 'Dubai',
        },
      ]);

      await service.handleMessage({ ...baseMessage, text: '/search restaurant' });

      expect(prismaService.providerProfile.findMany).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should handle /search with no query', async () => {
      await service.handleMessage({ ...baseMessage, text: '/search' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sendMessage'),
        expect.any(Object),
      );
    });

    it('should handle /categories command', async () => {
      (prismaService.category.findMany as jest.Mock).mockResolvedValue([
        { id: 'c1', name: 'Food & Drink', slug: 'food-drink', _count: { providers: 10 } },
        { id: 'c2', name: 'Beauty', slug: 'beauty-grooming', _count: { providers: 5 } },
      ]);

      await service.handleMessage({ ...baseMessage, text: '/categories' });

      expect(prismaService.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { parentId: null },
        }),
      );
    });

    it('should handle /deals command', async () => {
      (prismaService.deal.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'd1',
          title: '20% off',
          discountPercent: 20,
          providerProfile: { tenant: { name: 'Test', slug: 'test' } },
        },
      ]);

      await service.handleMessage({ ...baseMessage, text: '/deals' });

      expect(prismaService.deal.findMany).toHaveBeenCalled();
    });

    it('should handle /deals with no active deals', async () => {
      (prismaService.deal.findMany as jest.Mock).mockResolvedValue([]);

      await service.handleMessage({ ...baseMessage, text: '/deals' });

      expect(global.fetch).toHaveBeenCalled();
    });

    it('should handle /near command', async () => {
      await service.handleMessage({ ...baseMessage, text: '/near' });

      expect(global.fetch).toHaveBeenCalled();
    });

    it('should handle location message', async () => {
      await service.handleMessage({
        ...baseMessage,
        text: undefined,
        location: { latitude: 25.276987, longitude: 55.296249 },
      });

      expect(global.fetch).toHaveBeenCalled();
    });

    it('should ignore message with no text and no location', async () => {
      await service.handleMessage({ ...baseMessage, text: undefined });

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('sendMessage', () => {
    it('should call Telegram API', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({ ok: true, result: { message_id: 1 } }),
      });

      const result = await service.sendMessage(12345, 'Hello');

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sendMessage'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"chat_id":12345'),
        }),
      );
    });

    it('should handle Telegram API errors gracefully', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({ ok: false, description: 'Bad Request' }),
      });

      const result = await service.sendMessage(12345, 'Hello');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INTERNAL_ERROR');
    });

    it('should handle network errors gracefully', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await service.sendMessage(12345, 'Hello');

      expect(result.success).toBe(false);
    });

    it('should fail when bot token is not configured', async () => {
      const noTokenConfig = {
        telegram: {
          botToken: '',
          channelId: '',
          miniAppUrl: '',
          webhookSecret: '',
        },
      } as unknown as jest.Mocked<AppConfigService>;

      const noTokenService = new TelegramService(noTokenConfig, prismaService);
      const result = await noTokenService.sendMessage(12345, 'Hello');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INTERNAL_ERROR');
    });
  });
});
