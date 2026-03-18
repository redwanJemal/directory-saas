import { TelegramChannelService } from './telegram-channel.service';
import { TelegramService } from './telegram.service';
import { AppConfigService } from '../../config/app-config.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('TelegramChannelService', () => {
  let service: TelegramChannelService;
  let telegramService: jest.Mocked<TelegramService>;
  let configService: jest.Mocked<AppConfigService>;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(() => {
    configService = {
      telegram: {
        botToken: 'test-token',
        channelId: '@habesha_hub',
        miniAppUrl: 'https://t.me/testbot/app',
        webhookSecret: '',
      },
    } as unknown as jest.Mocked<AppConfigService>;

    prismaService = {
      providerProfile: {
        findUnique: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaService>;

    telegramService = {
      sendMessage: jest.fn().mockResolvedValue({ success: true }),
      sendPhoto: jest.fn().mockResolvedValue({ success: true }),
    } as unknown as jest.Mocked<TelegramService>;

    service = new TelegramChannelService(configService, prismaService, telegramService);
  });

  describe('postNewBusiness', () => {
    const profile = {
      tenant: { name: 'Abyssinia Kitchen', slug: 'abyssinia-kitchen' },
      bio: 'Authentic Ethiopian food',
      country: 'UAE',
      city: 'Dubai',
      whatsapp: '+971501234567',
      isVerified: true,
      categories: [{ category: { name: 'Restaurant' } }],
    };

    it('should post new business to channel', async () => {
      await service.postNewBusiness(profile);

      expect(telegramService.sendMessage).toHaveBeenCalledWith(
        '@habesha_hub',
        expect.stringContaining('New Business on Habesha Hub'),
        expect.objectContaining({
          inline_keyboard: expect.any(Array),
        }),
      );
    });

    it('should include business name in message', async () => {
      await service.postNewBusiness(profile);

      const call = telegramService.sendMessage.mock.calls[0];
      expect(call[1]).toContain('Abyssinia Kitchen');
    });

    it('should include verified badge', async () => {
      await service.postNewBusiness(profile);

      const call = telegramService.sendMessage.mock.calls[0];
      expect(call[1]).toContain('✅');
    });

    it('should include location', async () => {
      await service.postNewBusiness(profile);

      const call = telegramService.sendMessage.mock.calls[0];
      expect(call[1]).toContain('Dubai');
    });

    it('should not post when channel is not configured', async () => {
      const noChannelConfig = {
        telegram: { ...configService.telegram, channelId: '' },
      } as unknown as jest.Mocked<AppConfigService>;

      const noChannelService = new TelegramChannelService(
        noChannelConfig,
        prismaService,
        telegramService,
      );

      await noChannelService.postNewBusiness(profile);

      expect(telegramService.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('postNewDeal', () => {
    const deal = {
      id: 'deal-1',
      title: '20% Off All Items',
      description: 'Limited time offer',
      discountPercent: 20,
      discountAmount: null,
      providerProfile: {
        tenant: { name: 'Test Shop', slug: 'test-shop' },
        city: 'Abu Dhabi',
        country: 'UAE',
      },
    };

    it('should post new deal to channel', async () => {
      await service.postNewDeal(deal);

      expect(telegramService.sendMessage).toHaveBeenCalledWith(
        '@habesha_hub',
        expect.stringContaining('New Deal'),
        expect.objectContaining({
          inline_keyboard: expect.any(Array),
        }),
      );
    });

    it('should include deal title and discount', async () => {
      await service.postNewDeal(deal);

      const call = telegramService.sendMessage.mock.calls[0];
      expect(call[1]).toContain('20% Off All Items');
      expect(call[1]).toContain('20% off');
    });

    it('should include business name', async () => {
      await service.postNewDeal(deal);

      const call = telegramService.sendMessage.mock.calls[0];
      expect(call[1]).toContain('Test Shop');
    });

    it('should not post when channel is not configured', async () => {
      const noChannelConfig = {
        telegram: { ...configService.telegram, channelId: '' },
      } as unknown as jest.Mocked<AppConfigService>;

      const noChannelService = new TelegramChannelService(
        noChannelConfig,
        prismaService,
        telegramService,
      );

      await noChannelService.postNewDeal(deal);

      expect(telegramService.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('handleEntityCreated', () => {
    it('should skip non-ProviderProfile entities', async () => {
      await service.handleEntityCreated({
        entity: 'User',
        entityId: 'user-1',
      });

      expect(prismaService.providerProfile.findUnique).not.toHaveBeenCalled();
    });

    it('should skip when channel is not configured', async () => {
      const noChannelConfig = {
        telegram: { ...configService.telegram, channelId: '' },
      } as unknown as jest.Mocked<AppConfigService>;

      const noChannelService = new TelegramChannelService(
        noChannelConfig,
        prismaService,
        telegramService,
      );

      await noChannelService.handleEntityCreated({
        entity: 'ProviderProfile',
        entityId: 'profile-1',
      });

      expect(prismaService.providerProfile.findUnique).not.toHaveBeenCalled();
    });
  });
});
