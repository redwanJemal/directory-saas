import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';
import { AppConfigService } from '../../config/app-config.service';
import { ServiceResult } from '../../common/types';

describe('TelegramController', () => {
  let controller: TelegramController;
  let telegramService: jest.Mocked<TelegramService>;
  let configService: jest.Mocked<AppConfigService>;

  beforeEach(() => {
    telegramService = {
      handleMessage: jest.fn(),
      verifyInitData: jest.fn(),
    } as unknown as jest.Mocked<TelegramService>;

    configService = {
      telegram: {
        botToken: 'test-token',
        channelId: '@test',
        miniAppUrl: 'https://t.me/testbot/app',
        webhookSecret: 'my-secret',
      },
    } as unknown as jest.Mocked<AppConfigService>;

    controller = new TelegramController(telegramService, configService);
  });

  describe('handleWebhook', () => {
    it('should process message webhook', async () => {
      const body = {
        update_id: 1,
        message: {
          message_id: 1,
          chat: { id: 123, type: 'private' as const },
          date: Date.now(),
          text: '/start',
        },
      };

      const result = await controller.handleWebhook(body, 'my-secret');

      expect(result).toEqual({ ok: true });
      expect(telegramService.handleMessage).toHaveBeenCalledWith(body.message);
    });

    it('should reject invalid webhook secret', async () => {
      const body = { update_id: 1 };

      const result = await controller.handleWebhook(body, 'wrong-secret');

      expect(result).toEqual({ ok: true });
      expect(telegramService.handleMessage).not.toHaveBeenCalled();
    });

    it('should accept webhook when no secret is configured', async () => {
      const noSecretConfig = {
        telegram: { ...configService.telegram, webhookSecret: '' },
      } as unknown as jest.Mocked<AppConfigService>;

      const ctrl = new TelegramController(telegramService, noSecretConfig);

      const body = {
        update_id: 1,
        message: {
          message_id: 1,
          chat: { id: 123, type: 'private' as const },
          date: Date.now(),
          text: '/start',
        },
      };

      const result = await ctrl.handleWebhook(body);

      expect(result).toEqual({ ok: true });
      expect(telegramService.handleMessage).toHaveBeenCalled();
    });

    it('should handle update without message', async () => {
      const body = { update_id: 1 };

      const result = await controller.handleWebhook(body, 'my-secret');

      expect(result).toEqual({ ok: true });
      expect(telegramService.handleMessage).not.toHaveBeenCalled();
    });
  });

  describe('verifyInitData', () => {
    it('should verify valid initData', async () => {
      const user = { id: 123, first_name: 'Test' };
      telegramService.verifyInitData.mockReturnValue(ServiceResult.ok(user));

      const result = await controller.verifyInitData('init-data-string');

      expect(result).toEqual(user);
    });

    it('should throw on invalid initData', async () => {
      telegramService.verifyInitData.mockReturnValue(
        ServiceResult.fail('UNAUTHORIZED', 'Invalid'),
      );

      await expect(controller.verifyInitData('bad-data')).rejects.toThrow();
    });
  });
});
