import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Query,
  Logger,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TelegramService } from './telegram.service';
import { AppConfigService } from '../../config/app-config.service';
import { Public } from '../../common/decorators/public.decorator';
import { TelegramWebhookDto } from './dto';

@ApiTags('Telegram')
@Controller('api/v1/telegram')
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);

  constructor(
    private readonly telegramService: TelegramService,
    private readonly config: AppConfigService,
  ) {}

  @Post('webhook')
  @Public()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() body: TelegramWebhookDto,
    @Headers('x-telegram-bot-api-secret-token') secretToken?: string,
  ): Promise<{ ok: true }> {
    // Verify webhook secret if configured
    const webhookSecret = this.config.telegram.webhookSecret;
    if (webhookSecret && secretToken !== webhookSecret) {
      this.logger.warn('Invalid webhook secret token');
      return { ok: true };
    }

    if (body.message) {
      await this.telegramService.handleMessage(body.message);
    }

    return { ok: true };
  }

  @Get('verify-init-data')
  @Public()
  async verifyInitData(@Query('initData') initData: string) {
    const result = this.telegramService.verifyInitData(initData);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }
}
