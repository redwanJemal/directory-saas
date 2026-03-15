# Architecture Guide

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
│  ┌─────────────┐  ┌──────────────────┐  ┌─────────────────┐    │
│  │  Web App    │  │ Provider Portal  │  │   Admin App     │    │
│  │  React SPA  │  │   React SPA      │  │   React SPA     │    │
│  │  :3000      │  │   :3001          │  │   :3002         │    │
│  └──────┬──────┘  └────────┬─────────┘  └────────┬────────┘    │
│         │                  │                      │              │
│         └──────────────────┼──────────────────────┘              │
│                            │ HTTP/REST + SSE                     │
└────────────────────────────┼────────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────────┐
│                     API Gateway Layer                            │
│                            │                                     │
│  ┌─────────────────────────▼──────────────────────────────────┐ │
│  │                   NestJS Backend (:3333)                    │ │
│  │                                                             │ │
│  │  Middleware Chain:                                           │ │
│  │  CorrelationId → RequestLogging → SecurityHeaders           │ │
│  │  → TenantResolution → (route handlers)                      │ │
│  │                                                             │ │
│  │  Guards:                                                    │ │
│  │  ThrottlerGuard → JwtAuthGuard → RolesGuard                │ │
│  │  → PlanLimitGuard → FeatureGateGuard                       │ │
│  │                                                             │ │
│  │  Interceptors:                                              │ │
│  │  TransformInterceptor → TenantScopeInterceptor             │ │
│  │  → AuditInterceptor                                        │ │
│  └─────────────────────────┬──────────────────────────────────┘ │
└────────────────────────────┼────────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────────┐
│                      Data Layer                                  │
│         ┌──────────────────┼──────────────────┐                  │
│         │                  │                  │                   │
│  ┌──────▼──────┐  ┌───────▼───────┐  ┌──────▼──────┐           │
│  │ PostgreSQL  │  │    Redis      │  │   MinIO     │           │
│  │ + pgvector  │  │  Cache/Jobs   │  │   (S3)      │           │
│  │ + RLS       │  │  Rate Limits  │  │   Files     │           │
│  │ :5432       │  │  :6379        │  │   :9000     │           │
│  └─────────────┘  └───────────────┘  └─────────────┘           │
│                                                                  │
│  ┌─────────────┐  ┌───────────────┐                             │
│  │ Meilisearch │  │   Mailpit     │                             │
│  │ Full-text   │  │   SMTP/Dev    │                             │
│  │ :7700       │  │   :1025/:8025 │                             │
│  └─────────────┘  └───────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
```

## Multi-Tenancy Strategy

### Resolution

Tenants are resolved per-request through `TenantResolutionMiddleware`:

```
Request → Extract tenant from:
  1. Subdomain (acme.app.com → slug: "acme")
  2. X-Tenant-ID header (UUID)
  3. X-Tenant-Slug header (slug string)
  4. JWT payload (tenantId from authenticated user)
→ Validate tenant exists + active
→ Store in RequestContext (AsyncLocalStorage)
→ Available via @CurrentTenant() decorator
```

### Skipped Paths

Tenant resolution is skipped for: `/api/v1/auth/*`, `/api/v1/admin/*`, `/api/v1/health/*`, `/api/docs`.

### Database Isolation (RLS)

PostgreSQL Row-Level Security provides database-level tenant isolation:

```sql
-- Policy on tenant-scoped tables
CREATE POLICY tenant_isolation ON tenant_users
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Admin bypass
CREATE POLICY admin_bypass ON tenant_users
  USING (current_setting('app.bypass_rls', true) = 'true');
```

**RLS-enabled tables**: `tenant_users`, `roles`, `role_permissions`, `user_roles`, `audit_logs`, `tenant_subscriptions`

**PrismaService RLS methods**:
- `prisma.rls` — Auto-sets tenant from RequestContext
- `prisma.rlsBypass` — Admin bypass (no tenant filter)
- `prisma.forTenant(tenantId)` — Explicit tenant context

### Write Scoping

`TenantScopeInterceptor` automatically injects `tenantId` into POST/PATCH/PUT request bodies, ensuring all write operations are tenant-scoped.

## Authentication Flow

```
┌──────────┐     POST /auth/tenant/login      ┌──────────┐
│  Client  │ ──────────────────────────────►   │  Auth    │
│          │     { email, password }            │  Module  │
│          │                                    │          │
│          │   ◄────────────────────────────── │          │
│          │     { accessToken, refreshToken }  │          │
│          │                                    └──────────┘
│          │
│          │     GET /api/v1/providers
│          │     Authorization: Bearer <access_token>
│          │ ──────────────────────────────►   ┌──────────┐
│          │                                    │  Guard   │
│          │                                    │  Chain   │
│          │   ◄────────────────────────────── │          │
│          │     { success: true, data: [...] } └──────────┘
│          │
│          │     (15 min later, token expired)
│          │
│          │     POST /auth/refresh
│          │     { refreshToken }
│          │ ──────────────────────────────►   ┌──────────┐
│          │                                    │  Auth    │
│          │   ◄────────────────────────────── │  Module  │
│          │     { accessToken, refreshToken }  │          │
│          │     (new pair, old revoked)        └──────────┘
└──────────┘
```

### Token Details

| Token | TTL | Storage | Notes |
|-------|-----|---------|-------|
| Access (JWT) | 15 min | Client memory | Contains user ID, email, roles, permissions, tenantId |
| Refresh | 7 days | DB (hashed SHA-256) | Single-use, rotated on refresh, max 5 per user |

### Three Auth Flows

1. **Admin**: `POST /auth/admin/login` — AdminUser table, `SUPER_ADMIN` role
2. **Tenant**: `POST /auth/tenant/login` — TenantUser table, tenant-scoped roles/permissions
3. **Client**: `POST /auth/client/login` + `POST /auth/client/register` — ClientUser table

## Request Lifecycle

```
HTTP Request
  │
  ▼
Middleware (sequential)
  ├── CorrelationIdMiddleware    — Assign/extract X-Correlation-ID
  ├── RequestLoggingMiddleware   — Log request start
  ├── SecurityHeadersMiddleware  — X-Content-Type-Options, X-Frame-Options, etc.
  └── TenantResolutionMiddleware — Resolve tenant, store in AsyncLocalStorage
  │
  ▼
Guards (sequential, fail = 403/401/429)
  ├── ThrottlerGuard             — Rate limit check (Redis sliding window)
  ├── JwtAuthGuard               — Validate JWT, extract user (skip if @Public)
  ├── RolesGuard                 — Check @Roles() decorator
  ├── PlanLimitGuard             — Check @PlanLimit() resource counts
  └── FeatureGateGuard           — Check @FeatureGate() plan features
  │
  ▼
Pipes (per-parameter)
  ├── ZodValidationPipe          — Validate @Body() against Zod schema
  ├── QueryParametersPipe        — Parse bracket-notation filters, sort, pagination
  └── SanitizePipe (global)      — Strip HTML from all string inputs
  │
  ▼
Controller
  │ Calls service method(s)
  ▼
Service
  │ Returns ServiceResult<T>
  ▼
Controller
  │ Checks result.success
  │ Throws result.toHttpException() on failure
  │ Returns result.data on success
  ▼
Interceptors (reverse order, wrapping)
  ├── AuditInterceptor           — Log POST/PATCH/PUT/DELETE to audit_logs
  ├── TenantScopeInterceptor     — (already ran on request side)
  └── TransformInterceptor       — Wrap in { success, data, timestamp, traceId }
  │
  ▼
HTTP Response
```

## Module Communication

### Direct Import (Synchronous)

For direct service-to-service calls within a request:

```typescript
// roles.module.ts
@Module({
  imports: [PrismaModule],  // Import needed modules
  providers: [RolesService],
  exports: [RolesService],  // Export for other modules
})
export class RolesModule {}

// auth.module.ts
@Module({
  imports: [RolesModule],   // Import to use RolesService
  providers: [AuthService],
})
export class AuthModule {}
```

### Event Bus (Asynchronous)

For decoupled, async communication:

```typescript
// Emitting events (in any service)
this.eventBus.emit(new TenantCreatedEvent({
  tenantId: tenant.id,
  name: tenant.name,
}));

// Handling events (in EventHandlersService)
@OnEvent('tenant.created', { async: true })
async handleTenantCreated(event: TenantCreatedEvent) {
  // Create default roles, send welcome email, etc.
}
```

### Domain Events

14 typed events across 6 domains:

| Domain | Events |
|--------|--------|
| Tenant | `tenant.created`, `tenant.updated`, `tenant.suspended` |
| User | `user.created`, `user.updated`, `user.deleted` |
| Auth | `auth.login`, `auth.logout`, `auth.failed` |
| Entity | `entity.created`, `entity.updated`, `entity.deleted` |
| Subscription | `subscription.changed` |
| Role | `role.updated` |

All events are persisted to the `domain_events` table via `EventStoreService`.

### Background Jobs (BullMQ)

For deferred/scheduled work:

```typescript
// Queue a job
await this.jobService.add('email', 'send-welcome', {
  to: user.email,
  template: 'welcome',
});

// Scheduled jobs
await this.jobService.addRecurring('cleanup', 'cleanup-refresh-tokens', {}, '0 2 * * *');
```

**6 Named Queues**: email, notification, export, cleanup, indexing, ai

## Caching Strategy

```
CacheService
  ├── Key format: saas:{tenantId}:{namespace}:{key}
  ├── Default TTL: 5 minutes
  ├── Pattern invalidation: SCAN-based key deletion
  └── Cache-aside: getOrSet(key, fetchFn, ttl)

Cached entities:
  ├── Tenant settings (30s TTL in TenantCacheService)
  ├── User permissions (30s TTL in RolesGuard)
  ├── Plan limits & usage counts (60s TTL)
  └── Custom via @Cacheable() decorator
```

## Search Architecture

```
┌──────────────┐     Full-text      ┌──────────────┐
│  Search API  │ ──────────────►    │  Meilisearch │
│  /api/v1/    │                    │  (indexes)   │
│  search      │     Semantic       ┌──────────────┐
│              │ ──────────────►    │  pgvector    │
│              │                    │  (embeddings)│
└──────────────┘                    └──────────────┘
       ▲
       │ Entity events trigger indexing
       │
┌──────────────┐     BullMQ         ┌──────────────┐
│  Event Bus   │ ──────────────►    │  Indexing    │
│  entity.*    │                    │  Processor   │
└──────────────┘                    └──────────────┘
```

**Search modes**: `fulltext` (Meilisearch), `semantic` (pgvector cosine similarity), `hybrid` (both, merged)

## RBAC Model

```
TenantUser ──► UserRole ──► Role ──► RolePermission ──► Permission
                                         │
                              ┌───────────┘
                              │
                    resource:action format
                    e.g., "providers:read"
                         "providers:write"
                         "manage" (wildcard)
```

**Default Roles** (seeded per tenant): OWNER, ADMIN, MANAGER, MEMBER

**Permission format**: `{resource}:{action}` — e.g., `providers:read`, `users:write`, `roles:manage`

## Subscription & Plan Limits

```
SubscriptionPlan
  ├── Starter (free): 3 users, basic features
  ├── Professional ($49/mo): 25 users, ai-planner, advanced-analytics
  └── Enterprise ($199/mo): unlimited users, all features, priority-support

TenantSubscription
  ├── Links tenant to plan
  ├── Per-tenant limit overrides
  └── Usage tracking (cached counts)

Guards:
  ├── @PlanLimit('users') → checks count vs plan limit
  └── @FeatureGate('ai-planner') → checks feature in plan
```

## Deployment Architecture

### Development

```
Local machine
  ├── Backend: npm run start:dev (hot reload, :3333)
  ├── Frontend(s): npm run dev (:3000, :3001, :3002)
  └── Docker Compose: postgres, redis, minio, meilisearch, mailpit
```

### Production (Coolify)

```
Coolify Platform
  ├── docker-compose.coolify.yml
  │
  ├── Internal Network
  │   ├── directory-saas-api (NestJS, multi-stage build)
  │   ├── directory-saas-postgres (pgvector/pgvector:pg16)
  │   ├── directory-saas-redis (redis:7-alpine)
  │   ├── directory-saas-minio (minio/minio:latest)
  │   └── directory-saas-meilisearch (getmeili/meilisearch:v1.12)
  │
  ├── Coolify Network (external access)
  │   ├── directory-saas-api → reverse proxy
  │   ├── directory-saas-web (nginx, SPA)
  │   ├── directory-saas-provider (nginx, SPA)
  │   └── directory-saas-admin (nginx, SPA)
  │
  └── Volumes (persistent)
      ├── postgres_data
      ├── redis_data
      ├── minio_data
      └── meilisearch_data
```

### Docker Images

| Image | Base | Purpose |
|-------|------|---------|
| `Dockerfile.api` | node:22-alpine (build) → node:22-alpine (prod) | NestJS API with Prisma client |
| `Dockerfile.web` | node:22-alpine (build) → nginx:alpine (serve) | Client SPA |
| `Dockerfile.provider` | node:22-alpine (build) → nginx:alpine (serve) | Provider SPA |
| `Dockerfile.admin` | node:22-alpine (build) → nginx:alpine (serve) | Admin SPA |

Nginx configuration includes `try_files $uri $uri/ /index.html` for SPA routing, gzip compression, static asset caching (1 year), and security headers.
