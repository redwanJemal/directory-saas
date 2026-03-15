# Task 07: Multi-Tenancy Middleware — Tenant Resolution

## Summary
Implement middleware that resolves the current tenant from subdomain, header, or JWT claim, validates tenant status, and makes tenant context available throughout the request lifecycle.

## Current State
- NestJS app with logging, config, and error handling (Tasks 01–06).
- `Tenant` model exists in Prisma schema.
- `RequestContext` (AsyncLocalStorage) available.

## Required Changes

### 7.1 Tenant Resolution Middleware

**File**: `backend/src/common/middleware/tenant-resolution.middleware.ts`

**Resolution order** (first match wins):
1. **Subdomain**: `acme.directory-saas.com` → lookup by `slug = 'acme'`
2. **Header**: `X-Tenant-ID` (UUID) → lookup by `id`
3. **Header**: `X-Tenant-Slug` (string) → lookup by `slug`
4. **JWT claim**: `tenantId` from decoded token (set by auth)

**Validation**:
- Tenant must exist → `TENANT_NOT_FOUND`
- Tenant status must be `ACTIVE` or `TRIAL` → `TENANT_SUSPENDED` for suspended/cancelled
- Tenant must not be soft-deleted

**Skip paths** (no tenant required):
- `/api/v1/auth/register` (client registration)
- `/api/v1/auth/login` (login — tenant resolved after)
- `/api/v1/admin/*` (platform admin routes)
- `/api/v1/health` (health checks)
- `/api/docs` (Swagger)

**Store in RequestContext**:
```typescript
RequestContext.set('tenantId', tenant.id);
RequestContext.set('tenantSlug', tenant.slug);
```

### 7.2 Tenant Scope Interceptor

**File**: `backend/src/common/interceptors/tenant-scope.interceptor.ts`

For write operations (POST, PATCH, PUT), automatically inject `tenantId` into the request body if not present. This prevents controllers from manually setting it.

### 7.3 Current Tenant Decorator

**File**: `backend/src/common/decorators/current-tenant.decorator.ts`

```typescript
export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    // Get from RequestContext (AsyncLocalStorage)
    const tenantId = RequestContext.tenantId;
    if (!tenantId) throw new AppException('TENANT_REQUIRED', 'Tenant context is required');
    return tenantId;
  },
);
```

Usage: `@CurrentTenant() tenantId: string`

### 7.4 Tenant Cache

Cache tenant lookups in Redis (30s TTL) to avoid DB hit on every request:
- Key: `tenant:slug:{slug}` or `tenant:id:{id}`
- Invalidate on tenant update/delete

### 7.5 Tests

- Test: Resolves tenant from subdomain
- Test: Resolves tenant from `X-Tenant-ID` header
- Test: Resolves tenant from `X-Tenant-Slug` header
- Test: Returns 404 for non-existent tenant
- Test: Returns 403 for suspended tenant
- Test: Skips resolution for admin routes
- Test: Skips resolution for auth routes
- Test: Cache hit avoids database query
- Test: Cache invalidated on tenant update
- Test: `@CurrentTenant()` decorator extracts tenant ID
- Test: `@CurrentTenant()` throws when no tenant in context

## Acceptance Criteria

1. Tenant resolved from subdomain, header, or JWT (priority order)
2. Suspended/cancelled tenants are rejected with 403
3. Admin and auth routes skip tenant resolution
4. Tenant context available via `@CurrentTenant()` decorator and `RequestContext`
5. Tenant lookups cached in Redis (30s TTL)
6. All tests pass
