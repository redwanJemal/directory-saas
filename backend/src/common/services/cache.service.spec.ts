import { CacheService } from './cache.service';
import { RedisService } from './redis.service';

describe('CacheService', () => {
  let service: CacheService;
  let mockRedis: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRedis = {
      get: jest.fn(),
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
      scan: jest.fn().mockResolvedValue(['0', []]),
    };

    const mockRedisService = {
      getClient: jest.fn().mockReturnValue(mockRedis),
    } as unknown as RedisService;

    service = new CacheService(mockRedisService);
  });

  describe('get', () => {
    it('should return null on cache miss', async () => {
      mockRedis.get.mockResolvedValue(null);
      const result = await service.get('tenant-1', 'users', 'abc');
      expect(result).toBeNull();
      expect(mockRedis.get).toHaveBeenCalledWith('saas:tenant-1:users:abc');
    });

    it('should return deserialized value on cache hit', async () => {
      const data = { id: 'abc', name: 'Test' };
      mockRedis.get.mockResolvedValue(JSON.stringify(data));
      const result = await service.get('tenant-1', 'users', 'abc');
      expect(result).toEqual(data);
    });

    it('should return null on Redis error', async () => {
      mockRedis.get.mockRejectedValue(new Error('connection lost'));
      const result = await service.get('tenant-1', 'users', 'abc');
      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should store value with correct key format and default TTL', async () => {
      const data = { id: 'abc', name: 'Test' };
      await service.set('tenant-1', 'users', 'abc', data);
      expect(mockRedis.set).toHaveBeenCalledWith(
        'saas:tenant-1:users:abc',
        JSON.stringify(data),
        'EX',
        300,
      );
    });

    it('should store value with custom TTL', async () => {
      await service.set('tenant-1', 'users', 'abc', { id: 'abc' }, 60);
      expect(mockRedis.set).toHaveBeenCalledWith(
        'saas:tenant-1:users:abc',
        expect.any(String),
        'EX',
        60,
      );
    });

    it('should not throw on Redis error', async () => {
      mockRedis.set.mockRejectedValue(new Error('connection lost'));
      await expect(
        service.set('tenant-1', 'users', 'abc', { id: 'abc' }),
      ).resolves.toBeUndefined();
    });
  });

  describe('getOrSet', () => {
    it('should return cached value on cache hit without calling factory', async () => {
      const cached = { id: 'abc', name: 'Cached' };
      mockRedis.get.mockResolvedValue(JSON.stringify(cached));
      const factory = jest.fn();

      const result = await service.getOrSet('tenant-1', 'users', 'abc', factory);
      expect(result).toEqual(cached);
      expect(factory).not.toHaveBeenCalled();
    });

    it('should call factory on cache miss and store result', async () => {
      mockRedis.get.mockResolvedValue(null);
      const fresh = { id: 'abc', name: 'Fresh' };
      const factory = jest.fn().mockResolvedValue(fresh);

      const result = await service.getOrSet('tenant-1', 'users', 'abc', factory, 120);
      expect(result).toEqual(fresh);
      expect(factory).toHaveBeenCalled();
      expect(mockRedis.set).toHaveBeenCalledWith(
        'saas:tenant-1:users:abc',
        JSON.stringify(fresh),
        'EX',
        120,
      );
    });
  });

  describe('del', () => {
    it('should remove the specific key', async () => {
      await service.del('tenant-1', 'users', 'abc');
      expect(mockRedis.del).toHaveBeenCalledWith('saas:tenant-1:users:abc');
    });

    it('should not throw on Redis error', async () => {
      mockRedis.del.mockRejectedValue(new Error('connection lost'));
      await expect(service.del('tenant-1', 'users', 'abc')).resolves.toBeUndefined();
    });
  });

  describe('delByPattern', () => {
    it('should scan and delete matching keys', async () => {
      mockRedis.scan
        .mockResolvedValueOnce(['10', ['saas:tenant-1:users:a', 'saas:tenant-1:users:b']])
        .mockResolvedValueOnce(['0', ['saas:tenant-1:users:c']]);

      await service.delByPattern('tenant-1', 'users');
      expect(mockRedis.scan).toHaveBeenCalledWith('0', 'MATCH', 'saas:tenant-1:users:*', 'COUNT', 100);
      expect(mockRedis.del).toHaveBeenCalledTimes(2);
      expect(mockRedis.del).toHaveBeenCalledWith('saas:tenant-1:users:a', 'saas:tenant-1:users:b');
      expect(mockRedis.del).toHaveBeenCalledWith('saas:tenant-1:users:c');
    });

    it('should use custom pattern when provided', async () => {
      mockRedis.scan.mockResolvedValue(['0', []]);
      await service.delByPattern('tenant-1', 'users', 'active:*');
      expect(mockRedis.scan).toHaveBeenCalledWith(
        '0',
        'MATCH',
        'saas:tenant-1:users:active:*',
        'COUNT',
        100,
      );
    });

    it('should not call del when no keys match', async () => {
      mockRedis.scan.mockResolvedValue(['0', []]);
      await service.delByPattern('tenant-1', 'users');
      expect(mockRedis.del).not.toHaveBeenCalled();
    });
  });

  describe('delTenant', () => {
    it('should delete all keys for a tenant', async () => {
      mockRedis.scan
        .mockResolvedValueOnce(['0', ['saas:tenant-1:users:a', 'saas:tenant-1:plans:b']]);

      await service.delTenant('tenant-1');
      expect(mockRedis.scan).toHaveBeenCalledWith('0', 'MATCH', 'saas:tenant-1:*', 'COUNT', 100);
      expect(mockRedis.del).toHaveBeenCalledWith('saas:tenant-1:users:a', 'saas:tenant-1:plans:b');
    });
  });

  describe('platform cache', () => {
    it('should support _platform as tenantId for non-tenant data', async () => {
      const plans = [{ id: 'plan-1', name: 'Starter' }];
      mockRedis.get.mockResolvedValue(null);

      await service.set('_platform', 'plans', 'all', plans, 300);
      expect(mockRedis.set).toHaveBeenCalledWith(
        'saas:_platform:plans:all',
        JSON.stringify(plans),
        'EX',
        300,
      );
    });
  });
});
