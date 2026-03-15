import { Injectable } from '@nestjs/common';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

@Injectable()
export class TenantCacheService {
  private readonly cache = new Map<string, CacheEntry<unknown>>();
  private readonly DEFAULT_TTL_MS = 30_000; // 30 seconds

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    this.cache.set(key, {
      data: value,
      expiresAt: Date.now() + (ttlMs ?? this.DEFAULT_TTL_MS),
    });
  }

  async invalidate(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async invalidateByPattern(pattern: string): Promise<void> {
    for (const key of this.cache.keys()) {
      if (key.startsWith(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}
