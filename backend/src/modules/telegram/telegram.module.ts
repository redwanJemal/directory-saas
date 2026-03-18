import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramChannelService } from './telegram-channel.service';
import { TelegramController } from './telegram.controller';
import { AppConfigModule } from '../../config/app-config.module';

@Module({
  imports: [AppConfigModule],
  controllers: [TelegramController],
  providers: [TelegramService, TelegramChannelService],
  exports: [TelegramService, TelegramChannelService],
})
export class TelegramModule {}
