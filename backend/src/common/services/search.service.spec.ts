import { SearchService } from './search.service';
import { AppConfigService } from '../../config/app-config.service';

const mockIndex = {
  addDocuments: jest.fn().mockResolvedValue({ taskUid: 1 }),
  deleteDocuments: jest.fn().mockResolvedValue({ taskUid: 2 }),
  search: jest.fn().mockResolvedValue({
    hits: [{ id: 'doc-1', tenantId: 'tenant-1', name: 'Test' }],
    estimatedTotalHits: 1,
    processingTimeMs: 5,
  }),
  updateSearchableAttributes: jest.fn().mockResolvedValue({ taskUid: 3 }),
  updateFilterableAttributes: jest.fn().mockResolvedValue({ taskUid: 4 }),
};

const mockClient = {
  createIndex: jest.fn().mockResolvedValue({ taskUid: 0 }),
  tasks: {
    waitForTask: jest.fn().mockResolvedValue({}),
  },
  index: jest.fn().mockReturnValue(mockIndex),
  health: jest.fn().mockResolvedValue({ status: 'available' }),
};

jest.mock('meilisearch', () => ({
  MeiliSearch: jest.fn().mockImplementation(() => mockClient),
}));

describe('SearchService', () => {
  let service: SearchService;

  beforeEach(() => {
    jest.clearAllMocks();

    const mockConfig = {
      meilisearch: { url: 'http://localhost:7700', apiKey: 'test-key' },
    } as unknown as AppConfigService;

    service = new SearchService(mockConfig);
    service.onModuleInit();
  });

  describe('createIndex', () => {
    it('should create index with tenantId as filterable attribute', async () => {
      await service.createIndex('providers', 'id', ['name', 'description'], [
        'category',
        'status',
      ]);

      expect(mockClient.createIndex).toHaveBeenCalledWith('providers', {
        primaryKey: 'id',
      });
      expect(mockIndex.updateSearchableAttributes).toHaveBeenCalledWith([
        'name',
        'description',
      ]);
      expect(mockIndex.updateFilterableAttributes).toHaveBeenCalledWith([
        'tenantId',
        'category',
        'status',
      ]);
    });

    it('should handle index already exists by updating settings', async () => {
      mockClient.createIndex.mockRejectedValueOnce({ code: 'index_already_exists' });

      await service.createIndex('providers', 'id', ['name'], ['category']);

      expect(mockIndex.updateSearchableAttributes).toHaveBeenCalledWith(['name']);
      expect(mockIndex.updateFilterableAttributes).toHaveBeenCalledWith([
        'tenantId',
        'category',
      ]);
    });
  });

  describe('index', () => {
    it('should add documents with tenantId', async () => {
      const docs = [
        { id: 'doc-1', name: 'Provider A' },
        { id: 'doc-2', name: 'Provider B' },
      ];

      await service.index('providers', 'tenant-1', docs);

      expect(mockIndex.addDocuments).toHaveBeenCalledWith([
        { id: 'doc-1', name: 'Provider A', tenantId: 'tenant-1' },
        { id: 'doc-2', name: 'Provider B', tenantId: 'tenant-1' },
      ]);
    });
  });

  describe('remove', () => {
    it('should delete documents by IDs', async () => {
      await service.remove('providers', 'tenant-1', ['doc-1', 'doc-2']);

      expect(mockIndex.deleteDocuments).toHaveBeenCalledWith(['doc-1', 'doc-2']);
    });
  });

  describe('search', () => {
    it('should search with tenant isolation filter', async () => {
      const result = await service.search('providers', 'tenant-1', 'wedding');

      expect(mockIndex.search).toHaveBeenCalledWith('wedding', {
        filter: 'tenantId = "tenant-1"',
        offset: 0,
        limit: 20,
      });
      expect(result.hits).toHaveLength(1);
      expect(result.totalHits).toBe(1);
      expect(result.query).toBe('wedding');
    });

    it('should apply additional filters', async () => {
      await service.search('providers', 'tenant-1', 'photo', {
        filters: { category: 'photography', status: 'active' },
      });

      expect(mockIndex.search).toHaveBeenCalledWith('photo', {
        filter:
          'tenantId = "tenant-1" AND category = "photography" AND status = "active"',
        offset: 0,
        limit: 20,
      });
    });

    it('should apply array filters as OR conditions', async () => {
      await service.search('providers', 'tenant-1', 'event', {
        filters: { category: ['photography', 'catering'] as unknown as string },
      });

      expect(mockIndex.search).toHaveBeenCalledWith('event', {
        filter:
          'tenantId = "tenant-1" AND (category = "photography" OR category = "catering")',
        offset: 0,
        limit: 20,
      });
    });

    it('should handle pagination', async () => {
      await service.search('providers', 'tenant-1', 'test', {
        page: 3,
        pageSize: 10,
      });

      expect(mockIndex.search).toHaveBeenCalledWith('test', {
        filter: 'tenantId = "tenant-1"',
        offset: 20,
        limit: 10,
      });
    });

    it('should handle sort options', async () => {
      await service.search('providers', 'tenant-1', 'test', {
        sort: ['rating:desc', 'name:asc'],
      });

      expect(mockIndex.search).toHaveBeenCalledWith('test', {
        filter: 'tenantId = "tenant-1"',
        offset: 0,
        limit: 20,
        sort: ['rating:desc', 'name:asc'],
      });
    });
  });

  describe('isHealthy', () => {
    it('should return true when Meilisearch is healthy', async () => {
      const result = await service.isHealthy();
      expect(result).toBe(true);
    });

    it('should return false when Meilisearch is not reachable', async () => {
      mockClient.health.mockRejectedValueOnce(new Error('connection refused'));
      const result = await service.isHealthy();
      expect(result).toBe(false);
    });
  });
});
