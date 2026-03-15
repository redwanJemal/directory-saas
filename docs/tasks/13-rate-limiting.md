# Task 13: Rate Limiting — Redis Sliding Window

## Summary
Implement Redis-based rate limiting with per-tenant, per-endpoint, and per-IP strategies. Auth endpoints get stricter limits. Rate limit headers inform clients of remaining quota.

## Current State
- NestJS app with Redis configured (Task 03).
- Tenant context available (Task 07).

## Required Changes

### 13.1 Throttler Module

Use `@nestjs/throttler` with Redis storage:

**File**: `backend/src/common/guards/throttler-behind-proxy.guard.ts`

Custom throttler guard that:
- Uses `X-Forwarded-For` for IP (behind reverse proxy)
- Composes key from: `tenantId:userId:ip:endpoint`
- Falls back to IP-only for unauthenticated requests

### 13.2 Rate Limit Tiers

| Scope | Limit | Window | Key |
|-------|-------|--------|-----|
| Global (per IP) | 100 req | 60s | `rl:ip:{ip}` |
| Auth endpoints | 10 req | 60s | `rl:auth:{ip}` |
| Per tenant | 1000 req | 60s | `rl:tenant:{tenantId}` |
| Per user | 300 req | 60s | `rl:user:{userId}` |
| Upload endpoints | 20 req | 60s | `rl:upload:{userId}` |

### 13.3 Rate Limit Decorators

```typescript
@Throttle({ default: { limit: 10, ttl: 60 } })  // Override defaults
@SkipThrottle()                                    // Skip rate limiting
```

### 13.4 Response Headers

On every response:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1710504000
```

On 429:
```
Retry-After: 30
```

### 13.5 Redis Storage

Store rate limit counters in Redis with TTL matching the window. Use sorted sets for sliding window accuracy.

### 13.6 Tests

- Test: Request within limit succeeds
- Test: Request over limit returns 429 with `RATE_LIMIT_EXCEEDED`
- Test: Rate limit headers present on responses
- Test: Auth endpoints have stricter limits
- Test: Different tenants have independent limits
- Test: `@SkipThrottle()` bypasses rate limiting
- Test: Custom `@Throttle()` overrides defaults
- Test: `Retry-After` header present on 429

## Acceptance Criteria

1. Redis-based sliding window rate limiting
2. Per-IP, per-tenant, per-user limits
3. Stricter limits on auth endpoints
4. Rate limit headers on all responses
5. 429 response with `Retry-After` header
6. `@SkipThrottle()` and `@Throttle()` decorators
7. All tests pass
