import { Module } from '@nestjs/common';
import { CommunityEventsService } from './community-events.service';
import { ProviderEventsController, PublicEventsController } from './community-events.controller';

@Module({
  controllers: [ProviderEventsController, PublicEventsController],
  providers: [CommunityEventsService],
  exports: [CommunityEventsService],
})
export class CommunityEventsModule {}
