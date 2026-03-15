import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';
import type Redis from 'ioredis';

const DEFAULT_TTL_SECONDS = 300; // 5 minutes
const KEY_PREFIX = 'saas';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly redis: Redis;

  constructor(private readonly redisService: RedisService) {
    this.redis = this.redisService.getClient();
  }

  private buildKey(tenantId: string, namespace: string, key: string): string {
    return `${KEY_PREFIX}:${tenantId}:${namespace}:${key}`;
  }

  async get<T>(tenantId: string, namespace: string, key: string): Promise<T | null> {
    try {
      const raw = await this.redis.get(this.buildKey(tenantId, namespace, key));
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch (err) {
      this.logger.warn(`Cache get failed: ${(err as Error).message}`);
      return null;
    }
  }

  async set<T>(
    tenantId: string,
    namespace: string,
    key: string,
    value: T,
    ttlSeconds: number = DEFAULT_TTL_SECONDS,
  ): Promise<void> {
    try {
      const fullKey = this.buildKey(tenantId, namespace, key);
      const serialized = JSON.stringify(value);
      await this.redis.set(fullKey, serialized, 'EX', ttlSeconds);
    } catch (err) {
      this.logger.warn(`Cache set failed: ${(err as Error).message}`);
    }
  }

  async getOrSet<T>(
    tenantId: string,
    namespace: string,
    key: string,
    factory: () => Promise<T>,
    ttlSeconds: number = DEFAULT_TTL_SECONDS,
  ): Promise<T> {
    const cached = await this.get<T>(tenantId, namespace, key);
    if (cached !== null) return cached;

    const value = await factory();
    await this.set(tenantId, namespace, key, value, ttlSeconds);
    return value;
  }

  async del(tenantId: string, namespace: string, key: string): Promise<void> {
    try {
      await this.redis.del(this.buildKey(tenantId, namespace, key));
    } catch (err) {
      this.logger.warn(`Cache del failed: ${(err as Error).message}`);
    }
  }

  async delByPattern(tenantId: string, namespace: string, pattern?: string): Promise<void> {
    const scanPattern = pattern
      ? `${KEY_PREFIX}:${tenantId}:${namespace}:${pattern}`
      : `${KEY_PREFIX}:${tenantId}:${namespace}:*`;
    await this.deleteByPattern(scanPattern);
  }

  async delTenant(tenantId: string): Promise<void> {
    const scanPattern = `${KEY_PREFIX}:${tenantId}:*`;
    await this.deleteByPattern(scanPattern);
  }

  private async deleteByPattern(pattern: string): Promise<void> {
    try {
      let cursor = '0';
      do {
        const [nextCursor, keys] = await this.redis.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100,
        );
        cursor = nextCursor;
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } while (cursor !== '0');
    } catch (err) {
      this.logger.warn(`Cache deleteByPattern failed: ${(err as Error).message}`);
    }
  }
}
