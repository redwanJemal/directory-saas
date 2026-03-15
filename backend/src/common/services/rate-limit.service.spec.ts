import { RateLimitService } from './rate-limit.service';
import { RedisService } from './redis.service';

describe('RateLimitService', () => {
  let service: RateLimitService;
  let mockPipeline: Record<string, jest.Mock>;
  let mockClient: Record<string, jest.Mock>;

  beforeEach(() => {
    mockPipeline = {
      zremrangebyscore: jest.fn().mockReturnThis(),
      zcard: jest.fn().mockReturnThis(),
      zadd: jest.fn().mockReturnThis(),
      expire: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    };

    mockClient = {
      pipeline: jest.fn().mockReturnValue(mockPipeline),
      zrem: jest.fn().mockResolvedValue(1),
      zrange: jest.fn().mockResolvedValue([]),
    };

    const redisService = {
      getClient: jest.fn().mockReturnValue(mockClient),
    } as unknown as RedisService;

    service = new RateLimitService(redisService);
  });

  describe('check', () => {
    it('should allow request when under limit', async () => {
      mockPipeline.exec.mockResolvedValue([
        [null, 5], // zremrangebyscore
        [null, 3], // zcard: 3 requests in window
        [null, 1], // zadd
        [null, 1], // expire
      ]);

      const result = await service.check('rl:ip:127.0.0.1', 100, 60);

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(100);
      expect(result.remaining).toBe(96); // 100 - 3 - 1 = 96
      expect(result.resetTime).toBeDefined();
    });

    it('should deny request when at limit', async () => {
      mockPipeline.exec.mockResolvedValue([
        [null, 0], // zremrangebyscore
        [null, 100], // zcard: already at 100
        [null, 1], // zadd
        [null, 1], // expire
      ]);

      mockClient.zrange.mockResolvedValue([
        'member1',
        String(Date.now() - 30000),
      ]);

      const result = await service.check('rl:ip:127.0.0.1', 100, 60);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeDefined();
      expect(result.retryAfter).toBeGreaterThan(0);
      expect(mockClient.zrem).toHaveBeenCalled();
    });

    it('should return correct remaining count', async () => {
      mockPipeline.exec.mockResolvedValue([
        [null, 0],
        [null, 95], // 95 requests already in window
        [null, 1],
        [null, 1],
      ]);

      const result = await service.check('rl:ip:127.0.0.1', 100, 60);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4); // 100 - 95 - 1 = 4
    });

    it('should fail open when pipeline returns null', async () => {
      mockPipeline.exec.mockResolvedValue(null);

      const result = await service.check('rl:ip:127.0.0.1', 100, 60);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(99);
    });

    it('should fail open when Redis throws an error', async () => {
      mockPipeline.exec.mockRejectedValue(new Error('Redis connection lost'));

      const result = await service.check('rl:ip:127.0.0.1', 100, 60);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(99);
    });

    it('should use correct key and window parameters', async () => {
      mockPipeline.exec.mockResolvedValue([
        [null, 0],
        [null, 0],
        [null, 1],
        [null, 1],
      ]);

      await service.check('rl:auth:192.168.1.1', 10, 60);

      expect(mockClient.pipeline).toHaveBeenCalled();
      expect(mockPipeline.zremrangebyscore).toHaveBeenCalledWith(
        'rl:auth:192.168.1.1',
        0,
        expect.any(Number),
      );
      expect(mockPipeline.expire).toHaveBeenCalledWith(
        'rl:auth:192.168.1.1',
        60,
      );
    });

    it('should calculate retryAfter based on oldest entry', async () => {
      const now = Date.now();
      const oldestTimestamp = now - 30000; // 30 seconds ago

      mockPipeline.exec.mockResolvedValue([
        [null, 0],
        [null, 10], // at limit
        [null, 1],
        [null, 1],
      ]);

      mockClient.zrange.mockResolvedValue([
        'oldest-member',
        String(oldestTimestamp),
      ]);

      const result = await service.check('rl:auth:127.0.0.1', 10, 60);

      expect(result.allowed).toBe(false);
      // Oldest entry at -30s with 60s window means ~30s until it expires
      expect(result.retryAfter).toBeGreaterThanOrEqual(29);
      expect(result.retryAfter).toBeLessThanOrEqual(31);
    });
  });
});
