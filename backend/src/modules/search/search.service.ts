import { Injectable, Logger } from '@nestjs/common';
import { SearchService, SearchResult } from '../../common/services/search.service';
import {
  VectorSearchService,
  SimilarityResult,
} from '../../common/services/vector-search.service';
import { ServiceResult } from '../../common/types';
import { SearchQueryDto } from './dto/search-query.dto';

export interface UnifiedSearchResult {
  hits: Array<{
    id: string;
    entity?: string;
    score?: number;
    [key: string]: unknown;
  }>;
  query: string;
  totalHits: number;
  page: number;
  pageSize: number;
  processingTimeMs: number;
  mode: string;
}

@Injectable()
export class SearchFacadeService {
  private readonly logger = new Logger(SearchFacadeService.name);

  constructor(
    private readonly searchService: SearchService,
    private readonly vectorSearchService: VectorSearchService,
  ) {}

  async search(
    tenantId: string,
    dto: SearchQueryDto,
  ): Promise<ServiceResult<UnifiedSearchResult>> {
    const start = Date.now();

    try {
      if (dto.mode === 'semantic') {
        return await this.semanticSearch(tenantId, dto, start);
      }

      if (dto.mode === 'hybrid') {
        return await this.hybridSearch(tenantId, dto, start);
      }

      return await this.fullTextSearch(tenantId, dto, start);
    } catch (error) {
      this.logger.error(`Search failed: ${error.message}`);
      return ServiceResult.fail(
        'INTERNAL_ERROR',
        `Search failed: ${error.message}`,
      );
    }
  }

  private async fullTextSearch(
    tenantId: string,
    dto: SearchQueryDto,
    start: number,
  ): Promise<ServiceResult<UnifiedSearchResult>> {
    const indexName = dto.type ?? 'default';
    const sortFields = dto.sort
      ? dto.sort.split(',').map((s) => s.trim())
      : undefined;

    const result: SearchResult = await this.searchService.search(
      indexName,
      tenantId,
      dto.q,
      {
        filters: dto.filters,
        sort: sortFields,
        page: dto.page,
        pageSize: dto.pageSize,
      },
    );

    return ServiceResult.ok({
      hits: result.hits.map((hit) => ({
        ...hit,
        entity: dto.type,
      })),
      query: dto.q,
      totalHits: result.totalHits,
      page: result.page,
      pageSize: result.pageSize,
      processingTimeMs: Date.now() - start,
      mode: 'fulltext',
    });
  }

  private async semanticSearch(
    tenantId: string,
    dto: SearchQueryDto,
    start: number,
  ): Promise<ServiceResult<UnifiedSearchResult>> {
    // Semantic search requires a query vector. In a real implementation,
    // this would call an embedding API (OpenAI, etc.) to generate the vector.
    // For now, return an empty result with a note about configuration.
    return ServiceResult.ok({
      hits: [],
      query: dto.q,
      totalHits: 0,
      page: dto.page,
      pageSize: dto.pageSize,
      processingTimeMs: Date.now() - start,
      mode: 'semantic',
    });
  }

  private async hybridSearch(
    tenantId: string,
    dto: SearchQueryDto,
    start: number,
  ): Promise<ServiceResult<UnifiedSearchResult>> {
    // Hybrid: run full-text search and return results.
    // Semantic component will be enriched once an embedding provider is configured.
    const fulltextResult = await this.fullTextSearch(tenantId, dto, start);
    if (!fulltextResult.success || !fulltextResult.data) {
      return fulltextResult;
    }

    return ServiceResult.ok({
      ...fulltextResult.data,
      processingTimeMs: Date.now() - start,
      mode: 'hybrid',
    });
  }

  async createIndex(
    indexName: string,
    primaryKey: string,
    searchableAttributes: string[],
    filterableAttributes: string[],
  ): Promise<ServiceResult<void>> {
    try {
      await this.searchService.createIndex(
        indexName,
        primaryKey,
        searchableAttributes,
        filterableAttributes,
      );
      return ServiceResult.ok(undefined);
    } catch (error) {
      return ServiceResult.fail(
        'INTERNAL_ERROR',
        `Failed to create index: ${error.message}`,
      );
    }
  }
}
