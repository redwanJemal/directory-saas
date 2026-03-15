import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SearchService } from '../../common/services/search.service';
import { VectorSearchService } from '../../common/services/vector-search.service';
import { SearchFacadeService } from './search.service';
import { SearchController } from './search.controller';
import { SearchIndexSyncService } from './search-index-sync.service';

@Module({
  imports: [PrismaModule],
  controllers: [SearchController],
  providers: [
    SearchService,
    VectorSearchService,
    SearchFacadeService,
    SearchIndexSyncService,
  ],
  exports: [SearchService, VectorSearchService, SearchFacadeService],
})
export class SearchModule {}
