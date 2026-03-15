# Task 14: Caching Layer — Redis, Tenant-Aware

## Summary
Implement a tenant-aware caching layer with Redis, supporting TTL, pattern invalidation, and cache-aside pattern. Include a decorator for method-level caching.

## Current State
- Redis configured (Task 03).
- Tenant context available (Task 07).

## Required Changes

### 14.1 Cache Service

**File**: `backend/src/common/services/cache.service.ts`

```typescript
@Injectable()
export class CacheService {
  constructor(private readonly redis: Redis) {}

  // Tenant-aware key: `saas:{tenantId}:{namespace}:{key}`
  async get<T>(tenantId: string, namespace: string, key: string): Promise<T | null>;
  async set<T>(tenantId: string, namespace: string, key: string, value: T, ttlSeconds?: number): Promise<void>;
  async getOrSet<T>(tenantId: string, namespace: string, key: string, factory: () => Promise<T>, ttlSeconds?: number): Promise<T>;
  async del(tenantId: string, namespace: string, key: string): Promise<void>;
  async delByPattern(tenantId: string, namespace: string, pattern?: string): Promise<void>;
  async delTenant(tenantId: string): Promise<void>;  // Flush all tenant cache
}
```

**Key format**: `saas:{tenantId}:{namespace}:{key}`
**Default TTL**: 300 seconds (5 minutes)

### 14.2 Cache Decorator

**File**: `backend/src/common/decorators/cacheable.decorator.ts`

```typescript
@Cacheable({ namespace: 'tenants', ttl: 60, keyGenerator: (tenantId, id) => id })
async findById(tenantId: string, id: string): Promise<Tenant> { ... }
```

Uses `CacheService` under the hood. Auto-invalidates on matching `@CacheEvict`.

### 14.3 Cache Eviction Decorator

```typescript
@CacheEvict({ namespace: 'tenants', keyGenerator: (tenantId, id) => id })
async update(tenantId: string, id: string, dto: UpdateTenantDto): Promise<Tenant> { ... }
```

### 14.4 Platform Cache (No Tenant)

For platform-wide data (plans, permissions), use `tenantId = '_platform'`:
```typescript
async getPlans(): Promise<SubscriptionPlan[]> {
  return this.cache.getOrSet('_platform', 'plans', 'all', () => this.prisma.subscriptionPlan.findMany(), 300);
}
```

### 14.5 Tests

- Test: `set()` stores value in Redis with correct key format
- Test: `get()` retrieves value and deserializes correctly
- Test: `getOrSet()` calls factory on cache miss
- Test: `getOrSet()` returns cached value on cache hit
- Test: `del()` removes specific key
- Test: `delByPattern()` removes matching keys
- Test: `delTenant()` removes all keys for a tenant
- Test: TTL expiry works
- Test: `@Cacheable` decorator caches method result
- Test: `@CacheEvict` decorator invalidates cache

## Acceptance Criteria

1. Tenant-aware cache keys (`saas:{tenantId}:{namespace}:{key}`)
2. `get`, `set`, `getOrSet`, `del`, `delByPattern` methods
3. `@Cacheable` and `@CacheEvict` decorators
4. Platform cache for non-tenant data
5. Pattern-based invalidation
6. Default 5-minute TTL
7. All tests pass
