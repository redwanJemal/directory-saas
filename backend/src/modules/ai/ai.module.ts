import { Module } from '@nestjs/common';
import { SearchModule } from '../search/search.module';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AiProviderFactory } from './ai-provider.factory';

@Module({
  imports: [SearchModule],
  controllers: [AiController],
  providers: [AiService, AiProviderFactory],
  exports: [AiService],
})
export class AiModule {}
