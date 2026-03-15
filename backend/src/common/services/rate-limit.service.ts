import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);

  constructor(private readonly redisService: RedisService) {}

  /**
   * Sliding window rate limit using Redis sorted sets.
   * Each request is stored as a member with timestamp as score.
   * Expired entries are pruned on each check.
   *
   * @param key - Rate limit key (e.g., rl:ip:127.0.0.1)
   * @param limit - Maximum requests allowed in window
   * @param windowSeconds - Window size in seconds
   * @returns RateLimitResult with allowed status and metadata
   */
  async check(
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<RateLimitResult> {
    const client = this.redisService.getClient();
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const windowStart = now - windowMs;
    const resetTime = Math.ceil((now + windowMs) / 1000);

    try {
      // Use a pipeline for atomicity
      const pipeline = client.pipeline();

      // Remove entries outside the current window
      pipeline.zremrangebyscore(key, 0, windowStart);

      // Count current entries in window
      pipeline.zcard(key);

      // Add current request with timestamp as score and unique member
      const member = `${now}:${Math.random().toString(36).slice(2, 10)}`;
      pipeline.zadd(key, now, member);

      // Set TTL on the key to auto-cleanup
      pipeline.expire(key, windowSeconds);

      const results = await pipeline.exec();

      if (!results) {
        // Redis pipeline failed — allow request (fail open)
        this.logger.warn(`Rate limit pipeline returned null for key ${key}`);
        return { allowed: true, limit, remaining: limit - 1, resetTime };
      }

      // zcard result is at index 1 (after zremrangebyscore)
      const currentCount = (results[1]?.[1] as number) ?? 0;

      if (currentCount >= limit) {
        // Over limit — remove the entry we just added
        await client.zrem(key, member);

        const oldestEntry = await client.zrange(key, 0, 0, 'WITHSCORES');
        const oldestTimestamp = oldestEntry.length >= 2 ? Number(oldestEntry[1]) : now;
        const retryAfter = Math.ceil((oldestTimestamp + windowMs - now) / 1000);

        return {
          allowed: false,
          limit,
          remaining: 0,
          resetTime,
          retryAfter: Math.max(retryAfter, 1),
        };
      }

      const remaining = Math.max(limit - currentCount - 1, 0);
      return { allowed: true, limit, remaining, resetTime };
    } catch (error) {
      // Fail open — if Redis is down, don't block requests
      this.logger.error(
        `Rate limit check failed for key ${key}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return { allowed: true, limit, remaining: limit - 1, resetTime };
    }
  }
}
