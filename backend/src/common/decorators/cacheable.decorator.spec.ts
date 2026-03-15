import { Cacheable, CacheEvict } from './cacheable.decorator';
import { CacheService } from '../services/cache.service';

describe('Cacheable Decorator', () => {
  let mockCacheService: Partial<CacheService>;

  beforeEach(() => {
    mockCacheService = {
      getOrSet: jest.fn(),
      del: jest.fn().mockResolvedValue(undefined),
    };
  });

  describe('@Cacheable', () => {
    it('should cache method result using getOrSet', async () => {
      const expectedResult = { id: '123', name: 'Test' };
      (mockCacheService.getOrSet as jest.Mock).mockResolvedValue(expectedResult);

      class TestService {
        @Cacheable({ namespace: 'items', ttl: 60 })
        async findById(tenantId: string, id: string): Promise<unknown> {
          return { id, name: 'FromDB' };
        }
      }

      const instance = new TestService();
      (instance as unknown as Record<string, unknown>)['__cacheService__'] = mockCacheService;

      const result = await instance.findById('tenant-1', '123');

      expect(result).toEqual(expectedResult);
      expect(mockCacheService.getOrSet).toHaveBeenCalledWith(
        'tenant-1',
        'items',
        '123',
        expect.any(Function),
        60,
      );
    });

    it('should use custom keyGenerator when provided', async () => {
      (mockCacheService.getOrSet as jest.Mock).mockResolvedValue({});

      class TestService {
        @Cacheable({
          namespace: 'items',
          keyGenerator: (_tenantId: unknown, id: unknown) => `custom:${id}`,
        })
        async findById(tenantId: string, id: string): Promise<unknown> {
          return { id };
        }
      }

      const instance = new TestService();
      (instance as unknown as Record<string, unknown>)['__cacheService__'] = mockCacheService;

      await instance.findById('tenant-1', '456');

      expect(mockCacheService.getOrSet).toHaveBeenCalledWith(
        'tenant-1',
        'items',
        'custom:456',
        expect.any(Function),
        undefined,
      );
    });

    it('should fall back to original method when cacheService is not available', async () => {
      class TestService {
        @Cacheable({ namespace: 'items' })
        async findById(tenantId: string, id: string): Promise<unknown> {
          return { id, name: 'Direct' };
        }
      }

      const instance = new TestService();
      const result = await instance.findById('tenant-1', '789');
      expect(result).toEqual({ id: '789', name: 'Direct' });
    });
  });

  describe('@CacheEvict', () => {
    it('should evict cache after method execution', async () => {
      const updateResult = { id: '123', name: 'Updated' };

      class TestService {
        @CacheEvict({ namespace: 'items' })
        async update(tenantId: string, id: string): Promise<unknown> {
          return updateResult;
        }
      }

      const instance = new TestService();
      (instance as unknown as Record<string, unknown>)['__cacheService__'] = mockCacheService;

      const result = await instance.update('tenant-1', '123');

      expect(result).toEqual(updateResult);
      expect(mockCacheService.del).toHaveBeenCalledWith('tenant-1', 'items', '123');
    });

    it('should use custom keyGenerator for eviction', async () => {
      class TestService {
        @CacheEvict({
          namespace: 'items',
          keyGenerator: (_tenantId: unknown, id: unknown) => `custom:${id}`,
        })
        async remove(tenantId: string, id: string): Promise<unknown> {
          return { deleted: true };
        }
      }

      const instance = new TestService();
      (instance as unknown as Record<string, unknown>)['__cacheService__'] = mockCacheService;

      await instance.remove('tenant-1', '456');

      expect(mockCacheService.del).toHaveBeenCalledWith('tenant-1', 'items', 'custom:456');
    });

    it('should still return result even if cacheService is not available', async () => {
      class TestService {
        @CacheEvict({ namespace: 'items' })
        async update(tenantId: string, id: string): Promise<unknown> {
          return { id, updated: true };
        }
      }

      const instance = new TestService();
      const result = await instance.update('tenant-1', '123');
      expect(result).toEqual({ id: '123', updated: true });
    });
  });
});
