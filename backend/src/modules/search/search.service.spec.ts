import { SearchFacadeService } from './search.service';
import { SearchService } from '../../common/services/search.service';
import { VectorSearchService } from '../../common/services/vector-search.service';

describe('SearchFacadeService', () => {
  let service: SearchFacadeService;
  let mockSearchService: Record<string, jest.Mock>;
  let mockVectorSearchService: Record<string, jest.Mock>;

  beforeEach(() => {
    mockSearchService = {
      search: jest.fn().mockResolvedValue({
        hits: [{ id: 'hit-1', tenantId: 'tenant-1', name: 'Test' }],
        query: 'test',
        totalHits: 1,
        page: 1,
        pageSize: 20,
        processingTimeMs: 5,
      }),
      createIndex: jest.fn().mockResolvedValue(undefined),
    };

    mockVectorSearchService = {
      similaritySearch: jest.fn().mockResolvedValue([]),
    };

    service = new SearchFacadeService(
      mockSearchService as unknown as SearchService,
      mockVectorSearchService as unknown as VectorSearchService,
    );
  });

  describe('search — fulltext mode', () => {
    it('should return fulltext results with tenant isolation', async () => {
      const result = await service.search('tenant-1', {
        q: 'wedding photographer',
        mode: 'fulltext',
        page: 1,
        pageSize: 20,
      });

      expect(result.success).toBe(true);
      expect(result.data?.mode).toBe('fulltext');
      expect(result.data?.hits).toHaveLength(1);
      expect(result.data?.hits[0].id).toBe('hit-1');
      expect(mockSearchService.search).toHaveBeenCalledWith(
        'default',
        'tenant-1',
        'wedding photographer',
        {
          filters: undefined,
          sort: undefined,
          page: 1,
          pageSize: 20,
        },
      );
    });

    it('should search specific entity type', async () => {
      await service.search('tenant-1', {
        q: 'test',
        type: 'providers',
        mode: 'fulltext',
        page: 1,
        pageSize: 20,
      });

      expect(mockSearchService.search).toHaveBeenCalledWith(
        'providers',
        'tenant-1',
        'test',
        expect.objectContaining({}),
      );
    });

    it('should pass sort options', async () => {
      await service.search('tenant-1', {
        q: 'test',
        sort: '-rating,name',
        mode: 'fulltext',
        page: 1,
        pageSize: 20,
      });

      expect(mockSearchService.search).toHaveBeenCalledWith(
        'default',
        'tenant-1',
        'test',
        expect.objectContaining({
          sort: ['-rating', 'name'],
        }),
      );
    });
  });

  describe('search — semantic mode', () => {
    it('should return empty results in semantic mode (no embedding provider)', async () => {
      const result = await service.search('tenant-1', {
        q: 'wedding',
        mode: 'semantic',
        page: 1,
        pageSize: 20,
      });

      expect(result.success).toBe(true);
      expect(result.data?.mode).toBe('semantic');
      expect(result.data?.hits).toHaveLength(0);
    });
  });

  describe('search — hybrid mode', () => {
    it('should return hybrid results', async () => {
      const result = await service.search('tenant-1', {
        q: 'wedding',
        mode: 'hybrid',
        page: 1,
        pageSize: 20,
      });

      expect(result.success).toBe(true);
      expect(result.data?.mode).toBe('hybrid');
      expect(result.data?.hits).toHaveLength(1);
    });
  });

  describe('search — error handling', () => {
    it('should return ServiceResult.fail on search error', async () => {
      mockSearchService.search.mockRejectedValue(new Error('search failed'));

      const result = await service.search('tenant-1', {
        q: 'test',
        mode: 'fulltext',
        page: 1,
        pageSize: 20,
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('createIndex', () => {
    it('should delegate to SearchService', async () => {
      const result = await service.createIndex('providers', 'id', ['name'], [
        'category',
      ]);

      expect(result.success).toBe(true);
      expect(mockSearchService.createIndex).toHaveBeenCalledWith(
        'providers',
        'id',
        ['name'],
        ['category'],
      );
    });

    it('should return failure on error', async () => {
      mockSearchService.createIndex.mockRejectedValue(new Error('fail'));

      const result = await service.createIndex('x', 'id', [], []);

      expect(result.success).toBe(false);
    });
  });
});
