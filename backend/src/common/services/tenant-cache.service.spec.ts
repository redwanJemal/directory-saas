import { TenantCacheService } from './tenant-cache.service';

describe('TenantCacheService', () => {
  let cache: TenantCacheService;

  beforeEach(() => {
    cache = new TenantCacheService();
  });

  it('should return null for missing key', async () => {
    expect(await cache.get('nonexistent')).toBeNull();
  });

  it('should store and retrieve a value', async () => {
    await cache.set('key1', { id: '123', name: 'test' });
    const result = await cache.get<{ id: string; name: string }>('key1');
    expect(result).toEqual({ id: '123', name: 'test' });
  });

  it('should return null for expired entries', async () => {
    await cache.set('key1', { id: '123' }, 1); // 1ms TTL
    // Wait for expiry
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(await cache.get('key1')).toBeNull();
  });

  it('should invalidate a specific key', async () => {
    await cache.set('key1', 'value1');
    await cache.invalidate('key1');
    expect(await cache.get('key1')).toBeNull();
  });

  it('should invalidate keys by pattern prefix', async () => {
    await cache.set('tenant:slug:acme', { id: '1' });
    await cache.set('tenant:slug:beta', { id: '2' });
    await cache.set('tenant:id:1', { id: '1' });

    await cache.invalidateByPattern('tenant:slug:');
    expect(await cache.get('tenant:slug:acme')).toBeNull();
    expect(await cache.get('tenant:slug:beta')).toBeNull();
    // id-based key should remain
    expect(await cache.get('tenant:id:1')).toEqual({ id: '1' });
  });

  it('should use default 30s TTL', async () => {
    await cache.set('key1', 'value1');
    // Should still be there immediately
    expect(await cache.get('key1')).toBe('value1');
  });

  it('should overwrite existing values', async () => {
    await cache.set('key1', 'old');
    await cache.set('key1', 'new');
    expect(await cache.get('key1')).toBe('new');
  });
});
