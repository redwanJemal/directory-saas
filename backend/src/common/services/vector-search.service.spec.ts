import { VectorSearchService } from './vector-search.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('VectorSearchService', () => {
  let service: VectorSearchService;
  let mockPrisma: Record<string, jest.Mock>;

  beforeEach(() => {
    mockPrisma = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      $queryRaw: jest.fn().mockResolvedValue([]),
    };

    service = new VectorSearchService(mockPrisma as unknown as PrismaService);
  });

  describe('storeEmbedding', () => {
    it('should store an embedding with raw SQL', async () => {
      await service.storeEmbedding(
        'tenant-1',
        'provider',
        'entity-1',
        'A event photographer',
        [0.1, 0.2, 0.3],
      );

      expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(1);
    });

    it('should throw on database error', async () => {
      mockPrisma.$executeRaw.mockRejectedValue(new Error('DB error'));

      await expect(
        service.storeEmbedding('tenant-1', 'provider', 'entity-1', 'text', [0.1]),
      ).rejects.toThrow('DB error');
    });
  });

  describe('removeEmbedding', () => {
    it('should remove an embedding by tenant, entity, and entityId', async () => {
      await service.removeEmbedding('tenant-1', 'provider', 'entity-1');

      expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(1);
    });
  });

  describe('removeAllForEntity', () => {
    it('should remove all embeddings for an entity type', async () => {
      await service.removeAllForEntity('tenant-1', 'provider');

      expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(1);
    });
  });

  describe('similaritySearch', () => {
    it('should return ranked similarity results', async () => {
      const mockResults = [
        { entityId: 'e1', content: 'Event photographer', similarity: 0.95 },
        { entityId: 'e2', content: 'Event photographer', similarity: 0.85 },
      ];
      mockPrisma.$queryRaw.mockResolvedValue(mockResults);

      const results = await service.similaritySearch(
        'tenant-1',
        'provider',
        [0.1, 0.2, 0.3],
        10,
      );

      expect(results).toHaveLength(2);
      expect(results[0].similarity).toBe(0.95);
      expect(results[0].entityId).toBe('e1');
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
    });

    it('should use default limit of 10', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      await service.similaritySearch('tenant-1', 'provider', [0.1]);

      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
    });

    it('should throw on database error', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('vector error'));

      await expect(
        service.similaritySearch('tenant-1', 'provider', [0.1]),
      ).rejects.toThrow('vector error');
    });
  });

  describe('getEmbedding', () => {
    it('should return embedding record when found', async () => {
      const record = {
        id: 'emb-1',
        tenantId: 'tenant-1',
        entity: 'provider',
        entityId: 'entity-1',
        content: 'Some text',
      };
      mockPrisma.$queryRaw.mockResolvedValue([record]);

      const result = await service.getEmbedding('tenant-1', 'provider', 'entity-1');

      expect(result).toEqual(record);
    });

    it('should return null when not found', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      const result = await service.getEmbedding('tenant-1', 'provider', 'missing');

      expect(result).toBeNull();
    });
  });
});
