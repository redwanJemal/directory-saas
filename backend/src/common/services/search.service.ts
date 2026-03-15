import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { MeiliSearch, Index, SearchParams, SearchResponse } from 'meilisearch';
import { AppConfigService } from '../../config/app-config.service';

export interface SearchOptions {
  filters?: Record<string, string | string[] | number | boolean>;
  sort?: string[];
  page?: number;
  pageSize?: number;
  attributesToRetrieve?: string[];
  attributesToHighlight?: string[];
}

export interface SearchHit {
  id: string;
  tenantId: string;
  [key: string]: unknown;
}

export interface SearchResult {
  hits: SearchHit[];
  query: string;
  totalHits: number;
  page: number;
  pageSize: number;
  processingTimeMs: number;
}

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);
  private client: MeiliSearch;

  constructor(private readonly config: AppConfigService) {}

  onModuleInit(): void {
    const { url, apiKey } = this.config.meilisearch;
    this.client = new MeiliSearch({
      host: url,
      apiKey: apiKey || undefined,
    });
    this.logger.log(`Meilisearch client initialized (${url})`);
  }

  async createIndex(
    indexName: string,
    primaryKey: string,
    searchableAttributes: string[],
    filterableAttributes: string[],
  ): Promise<void> {
    try {
      const task = await this.client.createIndex(indexName, { primaryKey });
      await this.client.tasks.waitForTask(task.taskUid, { timeout: 10000 });

      const index = this.client.index(indexName);
      await index.updateSearchableAttributes(searchableAttributes);
      await index.updateFilterableAttributes([
        'tenantId',
        ...filterableAttributes,
      ]);

      this.logger.log(
        `Index '${indexName}' created with searchable=[${searchableAttributes.join(',')}], filterable=[tenantId,${filterableAttributes.join(',')}]`,
      );
    } catch (error) {
      if (
        error.code === 'index_already_exists' ||
        error.message?.includes('already exists')
      ) {
        this.logger.log(`Index '${indexName}' already exists, updating settings`);
        const index = this.client.index(indexName);
        await index.updateSearchableAttributes(searchableAttributes);
        await index.updateFilterableAttributes([
          'tenantId',
          ...filterableAttributes,
        ]);
        return;
      }
      this.logger.error(`Failed to create index '${indexName}': ${error.message}`);
      throw error;
    }
  }

  async index(
    indexName: string,
    tenantId: string,
    documents: Record<string, unknown>[],
  ): Promise<void> {
    try {
      const docsWithTenant = documents.map((doc) => ({
        ...doc,
        tenantId,
      }));

      const index = this.client.index(indexName);
      const task = await index.addDocuments(docsWithTenant);
      await this.client.tasks.waitForTask(task.taskUid, { timeout: 30000 });

      this.logger.log(
        `Indexed ${documents.length} document(s) in '${indexName}' for tenant ${tenantId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to index documents in '${indexName}': ${error.message}`,
      );
      throw error;
    }
  }

  async remove(
    indexName: string,
    tenantId: string,
    documentIds: string[],
  ): Promise<void> {
    try {
      const index = this.client.index(indexName);
      const task = await index.deleteDocuments(documentIds);
      await this.client.tasks.waitForTask(task.taskUid, { timeout: 30000 });

      this.logger.log(
        `Removed ${documentIds.length} document(s) from '${indexName}' for tenant ${tenantId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to remove documents from '${indexName}': ${error.message}`,
      );
      throw error;
    }
  }

  async search(
    indexName: string,
    tenantId: string,
    query: string,
    options: SearchOptions = {},
  ): Promise<SearchResult> {
    try {
      const index = this.client.index(indexName);

      const filterParts: string[] = [`tenantId = "${tenantId}"`];
      if (options.filters) {
        for (const [key, value] of Object.entries(options.filters)) {
          if (Array.isArray(value)) {
            const orParts = value.map((v) => `${key} = "${v}"`);
            filterParts.push(`(${orParts.join(' OR ')})`);
          } else if (typeof value === 'boolean') {
            filterParts.push(`${key} = ${value}`);
          } else if (typeof value === 'number') {
            filterParts.push(`${key} = ${value}`);
          } else {
            filterParts.push(`${key} = "${value}"`);
          }
        }
      }

      const page = options.page ?? 1;
      const pageSize = options.pageSize ?? 20;

      const searchParams: SearchParams = {
        filter: filterParts.join(' AND '),
        offset: (page - 1) * pageSize,
        limit: pageSize,
      };

      if (options.sort?.length) {
        searchParams.sort = options.sort;
      }
      if (options.attributesToRetrieve?.length) {
        searchParams.attributesToRetrieve = options.attributesToRetrieve;
      }
      if (options.attributesToHighlight?.length) {
        searchParams.attributesToHighlight = options.attributesToHighlight;
      }

      const response: SearchResponse = await index.search(query, searchParams);

      return {
        hits: response.hits as SearchHit[],
        query,
        totalHits: response.estimatedTotalHits ?? response.hits.length,
        page,
        pageSize,
        processingTimeMs: response.processingTimeMs,
      };
    } catch (error) {
      this.logger.error(
        `Search failed in '${indexName}' for tenant ${tenantId}: ${error.message}`,
      );
      throw error;
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const health = await this.client.health();
      return health.status === 'available';
    } catch {
      return false;
    }
  }

  getClient(): MeiliSearch {
    return this.client;
  }
}
