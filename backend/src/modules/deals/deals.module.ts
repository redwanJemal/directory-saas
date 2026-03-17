import { Module } from '@nestjs/common';
import { DealsService } from './deals.service';
import { ProviderDealsController, PublicDealsController } from './deals.controller';

@Module({
  controllers: [ProviderDealsController, PublicDealsController],
  providers: [DealsService],
  exports: [DealsService],
})
export class DealsModule {}
