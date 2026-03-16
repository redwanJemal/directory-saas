You are implementing task "Production Deployment — Coolify, Domain Routing, SSL" for the Directory SaaS boilerplate project.

## PROJECT CONTEXT

This is a TypeScript full-stack SaaS boilerplate with:
- Backend: NestJS 11 + Prisma 6 + PostgreSQL 16 + Redis 7
- Frontend: React 19 + Vite 7 + TypeScript + Tailwind CSS 4 + shadcn/ui
- Three frontend apps: apps/web (end clients), apps/provider-portal (providers), apps/admin (platform admin)
- Mobile: Expo (placeholder, future phase)
- Auth: JWT + refresh tokens, 3 user types (AdminUser, TenantUser, ClientUser)
- Multi-tenancy: Subdomain + header resolution, PostgreSQL RLS
- Validation: Zod end-to-end (NO class-validator)
- State: TanStack Query (server) + Zustand (client)

Project root: /home/redman/directory-saas

Key directories:
- backend/src/common/     — Shared infrastructure (guards, interceptors, middleware, pipes, decorators)
- backend/src/modules/    — Domain modules (auth, tenants, users, roles, subscriptions, etc.)
- backend/src/prisma/     — Prisma module + service
- backend/src/config/     — Configuration schemas + loader
- backend/prisma/         — Schema + migrations + seed
- apps/web/               — End client SPA
- apps/provider-portal/   — Provider dashboard SPA
- apps/admin/             — Platform admin SPA
- docker/                 — Docker Compose + Dockerfiles
- scripts/                — Task runner, coding standards, validators

## CODING STANDARDS (MANDATORY — follow these exactly)

# Directory SaaS — Coding Standards

> These standards are injected into every Claude task session. Follow them exactly.

---

## 1. Project Structure

```
backend/src/
├── common/                    # Shared infrastructure (NEVER domain logic)
│   ├── decorators/            # @CurrentUser, @CurrentTenant, @Public, @Roles, @RequirePermission
│   ├── dto/                   # QueryParametersDto, PaginationDto, ApiResponseDto
│   ├── filters/               # GlobalExceptionFilter, ValidationExceptionFilter
│   ├── guards/                # JwtAuthGuard, RolesGuard, PlanLimitGuard, ThrottlerGuard
│   ├── interceptors/          # TransformInterceptor, TenantScopeInterceptor, LoggingInterceptor
│   ├── middleware/             # TenantResolutionMiddleware, RequestLoggingMiddleware, CorrelationIdMiddleware
│   ├── pipes/                 # QueryParametersPipe, ZodValidationPipe
│   ├── services/              # CacheService, StorageService, EmailService
│   └── types/                 # Shared TypeScript types/interfaces
├── modules/                   # Domain modules
│   ├── auth/
│   ├── tenants/
│   ├── users/
│   ├── roles/
│   ├── subscriptions/
│   └── ...
├── prisma/                    # Prisma module + service
├── config/                    # Configuration schemas + loader
├── app.module.ts
└── main.ts
```

## 2. Naming Conventions

### Files
- **Modules**: `kebab-case.module.ts` (e.g., `auth.module.ts`)
- **Controllers**: `kebab-case.controller.ts` (e.g., `tenants.controller.ts`)
- **Services**: `kebab-case.service.ts` (e.g., `tenants.service.ts`)
- **DTOs**: `kebab-case.dto.ts` (e.g., `create-tenant.dto.ts`)
- **Guards**: `kebab-case.guard.ts` (e.g., `jwt-auth.guard.ts`)
- **Interceptors**: `kebab-case.interceptor.ts`
- **Middleware**: `kebab-case.middleware.ts`
- **Tests**: `kebab-case.spec.ts` (unit), `kebab-case.e2e-spec.ts` (e2e)
- **Factories**: `kebab-case.factory.ts` (test data)

### Classes
- **PascalCase** for all classes: `TenantsService`, `CreateTenantDto`, `JwtAuthGuard`
- **Suffix matches file type**: Service, Controller, Module, Guard, Interceptor, Middleware, Pipe, Filter

### Variables & Functions
- **camelCase** for variables and functions
- **UPPER_SNAKE_CASE** for constants and env vars
- **No abbreviations** unless universally understood (e.g., `id`, `url`, `dto`)

### Database
- **snake_case** for all table and column names (Prisma `@@map` / `@map`)
- **Plural** table names: `tenants`, `users`, `audit_logs`
- **Singular** model names in Prisma: `Tenant`, `User`, `AuditLog`

## 3. API Conventions

### URL Structure
```
/api/v1/{resource}                     # Collection
/api/v1/{resource}/:id                 # Single resource
/api/v1/tenants/:tenantId/{resource}   # Tenant-scoped resource
/api/v1/admin/{resource}               # Platform admin
/api/v1/me                             # Current user
```

- **Plural nouns** for resources (never verbs)
- **kebab-case** for multi-word resources: `/api/v1/subscription-plans`
- **Version prefix**: Always `/api/v1/`

### HTTP Methods
| Method | Purpose | Response Code |
|--------|---------|---------------|
| GET | Read (single or list) | 200 |
| POST | Create | 201 |
| PATCH | Partial update | 200 |
| DELETE | Soft delete | 200 |
| PUT | Full replace (rare) | 200 |

### Response Envelope

**Success (single)**:
```json
{
  "success": true,
  "data": { "id": "uuid", "name": "..." },
  "timestamp": "2026-03-15T12:00:00Z",
  "traceId": "abc-123"
}
```

**Success (paginated list)**:
```json
{
  "success": true,
  "data": [{ ... }, { ... }],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalCount": 150,
    "totalPages": 8
  },
  "timestamp": "2026-03-15T12:00:00Z",
  "traceId": "abc-123"
}
```

**Error**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  },
  "timestamp": "2026-03-15T12:00:00Z",
  "traceId": "abc-123"
}
```

### Query Parameters — Filtering

**Bracket notation** with array support:
```
GET /api/v1/providers?filter[category]=photography,catering,venue
GET /api/v1/providers?filter[status]=active,verified
GET /api/v1/providers?filter[rating][gte]=4.0
GET /api/v1/providers?filter[price][gte]=100&filter[price][lte]=5000
GET /api/v1/providers?filter[city]=addis-ababa
GET /api/v1/providers?filter[createdAt][gte]=2026-01-01
```

**Operators**: `eq` (default), `gt`, `gte`, `lt`, `lte`, `contains`, `startsWith`, `endsWith`, `in`, `isNull`

**Multiple values** (comma-separated = OR within field):
```
filter[category]=photography,catering    → category IN ('photography', 'catering')
filter[status]=active,verified           → status IN ('active', 'verified')
```

**Sorting**:
```
sort=name             # ASC
sort=-createdAt       # DESC (prefix with -)
sort=-rating,name     # Multiple: rating DESC, then name ASC
```

**Pagination**:
```
page=1&pageSize=20    # Defaults: page=1, pageSize=20, max pageSize=100
```

**Includes** (eager load relations):
```
include=reviews,services    # Load related entities
```

**Search** (full-text):
```
search=wedding photographer addis    # Full-text search across configured fields
```

### Error Codes

Standard error codes (defined in `common/constants/error-codes.ts`):
```typescript
export const ErrorCodes = {
  // Auth
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // Resources
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // Tenancy
  TENANT_NOT_FOUND: 'TENANT_NOT_FOUND',
  TENANT_SUSPENDED: 'TENANT_SUSPENDED',
  TENANT_REQUIRED: 'TENANT_REQUIRED',

  // Plan limits
  PLAN_LIMIT_REACHED: 'PLAN_LIMIT_REACHED',
  FEATURE_NOT_AVAILABLE: 'FEATURE_NOT_AVAILABLE',

  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;
```

## 4. Module Structure

Every domain module follows this structure:
```
modules/{name}/
├── {name}.module.ts           # Module definition
├── {name}.controller.ts       # REST endpoints
├── {name}.service.ts          # Business logic
├── dto/
│   ├── create-{name}.dto.ts   # Zod schema + inferred type
│   ├── update-{name}.dto.ts
│   └── {name}-query.dto.ts    # Module-specific filters (extends base)
├── {name}.spec.ts             # Unit tests for service
├── {name}.controller.spec.ts  # Unit tests for controller
└── {name}.e2e-spec.ts         # E2E tests
```

### Rules
- **One module = one bounded context**. Don't split prematurely.
- **Services NEVER throw**. Return `{ success, data, error }` result objects.
- **Controllers** handle HTTP concerns (status codes, headers). Services handle domain logic.
- **Cross-module communication**: Import the other module, inject its service. For async: use the event bus.
- **DTOs use Zod schemas** — derive TypeScript types with `z.infer<>`.

## 5. DTOs & Validation

```typescript
// dto/create-tenant.dto.ts
import { z } from 'zod';

export const CreateTenantSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  ownerEmail: z.string().email(),
  plan: z.enum(['starter', 'professional', 'enterprise']).default('starter'),
});

export type CreateTenantDto = z.infer<typeof CreateTenantSchema>;
```

### Rules
- **Always define Zod schema first**, then infer the DTO type.
- **Never use class-validator/class-transformer** — Zod only.
- **Validate at the controller level** using `ZodValidationPipe`.
- **Separate create/update DTOs** — update should use `.partial()`.

## 6. Service Pattern

```typescript
@Injectable()
export class TenantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async create(dto: CreateTenantDto): Promise<ServiceResult<Tenant>> {
    const existing = await this.prisma.tenant.findUnique({ where: { slug: dto.slug } });
    if (existing) {
      return ServiceResult.fail('ALREADY_EXISTS', `Tenant with slug '${dto.slug}' already exists`);
    }

    const tenant = await this.prisma.tenant.create({ data: dto });
    return ServiceResult.ok(tenant);
  }

  async findAll(tenantId: string, query: QueryParametersDto): Promise<ServiceResult<PaginatedResult<Tenant>>> {
    const { where, orderBy, skip, take } = buildPrismaQuery(query);
    const [items, total] = await Promise.all([
      this.prisma.tenant.findMany({ where, orderBy, skip, take }),
      this.prisma.tenant.count({ where }),
    ]);
    return ServiceResult.ok(paginate(items, total, query));
  }
}
```

### Rules
- **Never throw from services**. Always return `ServiceResult<T>`.
- **Never access `Request` or `Response`** in services — that's controller territory.
- **Prisma queries always include `tenantId`** in where clauses (unless explicitly platform-wide).
- **Cache keys always include tenantId**: `tenant:{tenantId}:{entity}:{id}`.

## 7. Controller Pattern

```typescript
@ApiTags('Tenants')
@Controller('api/v1/admin/tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body(new ZodValidationPipe(CreateTenantSchema)) dto: CreateTenantDto) {
    const result = await this.tenantsService.create(dto);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Get()
  async findAll(@Query() query: QueryParametersDto) {
    const result = await this.tenantsService.findAll(query);
    if (!result.success) throw result.toHttpException();
    return result.data; // TransformInterceptor wraps this
  }
}
```

### Rules
- **Always use `@ApiTags`** for Swagger grouping.
- **Always specify `@HttpCode`** for POST (201), DELETE (200).
- **Inject ZodValidationPipe** per-parameter, not globally (keeps validation explicit).
- **Controllers convert ServiceResult failures to HTTP exceptions** via `result.toHttpException()`.
- **The TransformInterceptor wraps the return value** — don't manually construct the envelope.

## 8. Testing

### Unit Tests (`.spec.ts`)
- Test services in isolation with mocked dependencies.
- Use factories for test data (never hardcode UUIDs or strings).
- One `describe` block per method, one `it` block per behavior.
- Test both success and failure paths.

### E2E Tests (`.e2e-spec.ts`)
- Hit real endpoints with a test database.
- Create test tenant + user per suite (cleanup in `afterAll`).
- Assert on response envelope structure, status codes, and data.
- Test auth (valid token, expired token, wrong role).
- Test tenant isolation (user A can't see user B's data).

### Coverage Target
- **Services**: 80%+ line coverage
- **Guards/Interceptors**: 90%+ (they're critical infrastructure)
- **Controllers**: E2E tests cover these implicitly

### Test File Naming
```
tenants.service.spec.ts          # Unit
tenants.controller.spec.ts       # Unit (mocked service)
tenants.e2e-spec.ts              # E2E (real HTTP)
```

## 9. Database & Prisma

### Schema Rules
- Every tenant-scoped model has `tenantId String @db.Uuid` with `@relation`.
- Every model has `createdAt DateTime @default(now()) @db.Timestamptz` and `updatedAt DateTime @updatedAt @db.Timestamptz`.
- Soft-deletable models have `deletedAt DateTime? @db.Timestamptz`.
- Use `@map("snake_case")` for column names, `@@map("snake_case_plural")` for tables.
- Indexes on: `tenantId`, `status`, `createdAt`, `deletedAt` (partial index for non-null).
- UUIDs for all primary keys: `id String @id @default(uuid()) @db.Uuid`.
- Decimals as `Decimal` type (never Float): `price Decimal @db.Decimal(12, 2)`.

### Migration Rules
- **Never edit existing migrations** — always create new ones.
- **Migration names are descriptive**: `npx prisma migrate dev --name add_reviews_table`.
- **Seed file** (`prisma/seed.ts`): Idempotent — safe to run multiple times.

## 10. Security Rules

- **Never log sensitive data**: passwords, tokens, API keys, PII.
- **Never expose stack traces** in production error responses.
- **Always validate at system boundaries**: controller inputs (Zod), query params (pipe), file uploads (type + size).
- **Always use parameterized queries** — Prisma handles this, but raw queries MUST use `$queryRaw` with tagged template.
- **Sanitize HTML** in user-generated content (descriptions, reviews) before storage.
- **Rate limit all public endpoints** and auth endpoints more aggressively.
- **Refresh tokens**: stored hashed, single-use (rotate on refresh), tied to device/IP.

## 11. Performance Rules

- **Always paginate lists** — no unbounded queries. Max `pageSize` = 100.
- **Select only needed fields** — use Prisma `select` for large entities.
- **Batch related queries** — `Promise.all()` for independent DB calls.
- **Cache expensive computations** — tenant settings, permissions, plan limits.
- **Use database indexes** — every `WHERE` clause field should have an index.
- **Lazy load relations** — use `include` parameter, don't always eager-load.
- **Connection pooling** — Prisma handles this; don't open new connections manually.

## 12. Frontend Standards (CRITICAL — Apply to ALL frontend tasks)

### No Static Colors
- **NEVER hardcode color values** (hex, rgb, hsl, oklch) in components or Tailwind classes
- **ALL colors MUST come from CSS variables** defined in index.css (--background, --foreground, --primary, --secondary, --accent, --muted, --card, --border, --destructive, etc.)
- Use Tailwind semantic classes: `bg-background`, `text-foreground`, `bg-primary`, `text-primary-foreground`, `bg-card`, `border-border`, `bg-muted`, `text-muted-foreground`, `bg-accent`, `bg-destructive`
- **NEVER use**: `bg-blue-500`, `text-gray-700`, `border-red-300`, `bg-white`, `bg-black`, `text-[#hex]`, or any Tailwind default color palette class
- The ONLY color source is the OKLch theme system via `--brand-hue`. Changing `--brand-hue` must rebrand the entire app.
- Dark mode must work automatically via `.dark` class on `<html>` element

### No Static Text
- **NEVER hardcode user-facing strings** in components — no English text in JSX/TSX
- **ALL visible text MUST use `t()` from react-i18next**: `{t('nav.dashboard')}`, `{t('common.save')}`, `{t('auth.login_title')}`
- This includes: page titles, button labels, form labels, placeholder text, error messages, toast messages, empty states, tooltips, menu items, breadcrumbs, column headers, status labels, confirmation dialogs
- Only exceptions: brand name (from branding.ts), icons, numeric values, dates
- Translation keys use dot notation: `nav.*`, `common.*`, `auth.*`, `tenants.*`, `errors.*`, `dashboard.*`
- Every new string must be added to BOTH en.json and am.json (Amharic can be placeholder initially)

### Reusability Rules
- **All branding from lib/branding.ts** — app name, logo, tagline, hue. No hardcoded app names.
- **All config from environment variables** — API URL, storage keys, feature flags
- **localStorage keys prefixed**: `saas_admin_*`, `saas_provider_*`, `saas_web_*`
- **Components must be generic** — no domain-specific logic in UI components (components/ui/)
- **Feature-specific code in features/ directory** — pages, dialogs, domain hooks

### Frontend File Naming
- **Files**: `kebab-case.tsx` (components), `kebab-case.ts` (hooks, utils, stores)
- **Components**: `PascalCase` export (e.g., `export function DashboardLayout()`)
- **Hooks**: `use-kebab-case.ts` with `useKebabCase` export
- **Stores**: `kebab-case-store.ts`
- **Translations**: `en.json`, `am.json` in i18n/ directory

### Frontend Directory Structure (per app)
```
apps/{app}/src/
├── components/
│   ├── layout/          # DashboardLayout, Sidebar, Header, ProtectedRoute
│   ├── ui/              # shadcn/ui components (Button, Card, Dialog, etc.)
│   └── data-table/      # Reusable data table components
├── features/            # Feature modules (pages + feature-specific components)
│   ├── auth/            # LoginPage, RegisterPage
│   ├── dashboard/       # DashboardPage
│   └── {feature}/       # Feature-specific pages, dialogs, hooks
├── hooks/               # Shared custom hooks
├── i18n/                # i18next config + translation JSON files
├── lib/                 # Utilities (api.ts, branding.ts, utils.ts)
├── stores/              # Zustand stores
├── test/                # Test setup + utilities
├── main.tsx
└── index.css            # Tailwind + OKLch theme variables
```

## 13. Git & Commit Rules

- **Conventional commits**: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`.
- **One concern per commit** — don't mix features with fixes.
- **Never commit**: `.env`, `node_modules/`, `dist/`, `*.log`, `.prisma/client/`.

## SUBTASK PROGRESS

These subtasks have already been tracked:
  - docker-compose: pending
  - traefik-labels: pending
  - nginx-configs: pending
  - env-template: pending
  - deploy-script: pending
  - documentation: pending



## TASK SPECIFICATION

# Task 47: Production Deployment — Coolify, Domain Routing, SSL

## Summary
Configure production deployment with Docker Compose for Coolify, Traefik reverse proxy labels for subdomain routing, nginx configs for all SPAs, production environment setup, and deployment scripts. Subdomain plan: `api.{DOMAIN}` for backend, `app.{DOMAIN}` for web client, `admin.{DOMAIN}` for admin, and `*.{DOMAIN}` (wildcard) for provider portals resolved by tenant slug.

## Current State
- `docker/docker-compose.coolify.yml` exists with basic service definitions (api, web, provider-portal, admin, postgres, redis, minio, meilisearch)
- Services use internal + coolify networks
- No Traefik labels for subdomain routing
- `docker/nginx/spa.conf` exists but is basic
- Dockerfiles exist: `Dockerfile.api`, `Dockerfile.web`, `Dockerfile.provider`, `Dockerfile.admin`
- Backend `TenantResolutionMiddleware` already handles subdomain → tenant resolution
- No `.env.production.example`
- No deployment script
- No deployment documentation

## Required Changes

### 47.1 Update docker-compose.coolify.yml

Rewrite `docker/docker-compose.coolify.yml` with Traefik labels, health checks, proper environment, and subdomain routing:

```yaml
services:
  api:
    build:
      context: ..
      dockerfile: docker/Dockerfile.api
    container_name: directory-saas-api
    restart: unless-stopped
    environment:
      NODE_ENV: production
      APP_PORT: 3000
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}?schema=public
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: ${REDIS_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      JWT_ACCESS_EXPIRY: ${JWT_ACCESS_EXPIRY:-15m}
      JWT_REFRESH_EXPIRY: ${JWT_REFRESH_EXPIRY:-7d}
      CORS_ORIGINS: ${CORS_ORIGINS}
      S3_ENDPOINT: http://minio:9000
      S3_PUBLIC_URL: ${S3_PUBLIC_URL:-https://s3.${DOMAIN}}
      S3_ACCESS_KEY: ${MINIO_ROOT_USER}
      S3_SECRET_KEY: ${MINIO_ROOT_PASSWORD}
      S3_BUCKET: ${S3_BUCKET:-directory-saas}
      S3_REGION: ${S3_REGION:-us-east-1}
      MEILISEARCH_URL: http://meilisearch:7700
      MEILISEARCH_API_KEY: ${MEILI_MASTER_KEY}
      SMTP_HOST: ${SMTP_HOST}
      SMTP_PORT: ${SMTP_PORT:-587}
      SMTP_USER: ${SMTP_USER}
      SMTP_PASS: ${SMTP_PASS}
      SMTP_FROM: ${SMTP_FROM}
      SMTP_SECURE: ${SMTP_SECURE:-true}
      LOG_LEVEL: ${LOG_LEVEL:-info}
      THROTTLE_TTL: ${THROTTLE_TTL:-60}
      THROTTLE_LIMIT: ${THROTTLE_LIMIT:-100}
      DOMAIN: ${DOMAIN}
    networks:
      - internal
      - coolify
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      meilisearch:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 40s
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.api.rule=Host(`api.${DOMAIN}`)"
      - "traefik.http.routers.api.entrypoints=https"
      - "traefik.http.routers.api.tls=true"
      - "traefik.http.services.api.loadbalancer.server.port=3000"
      - "traefik.http.routers.api.middlewares=api-cors@docker"
      # CORS middleware
      - "traefik.http.middlewares.api-cors.headers.accesscontrolallowmethods=GET,POST,PUT,PATCH,DELETE,OPTIONS"
      - "traefik.http.middlewares.api-cors.headers.accesscontrolallowheaders=Content-Type,Authorization,X-Tenant-ID,X-Tenant-Slug"
      - "traefik.http.middlewares.api-cors.headers.accesscontrolalloworiginlist=https://app.${DOMAIN},https://admin.${DOMAIN},https://*.${DOMAIN}"
      - "traefik.http.middlewares.api-cors.headers.accesscontrolmaxage=86400"

  web:
    build:
      context: ..
      dockerfile: docker/Dockerfile.web
      args:
        VITE_API_URL: https://api.${DOMAIN}
        VITE_BRAND_NAME: ${BRAND_NAME:-Directory SaaS}
        VITE_BRAND_HUE: ${BRAND_HUE:-230}
    container_name: directory-saas-web
    restart: unless-stopped
    networks:
      - internal
      - coolify
    depends_on:
      - api
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80/"]
      interval: 30s
      timeout: 5s
      retries: 3
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.web.rule=Host(`app.${DOMAIN}`)"
      - "traefik.http.routers.web.entrypoints=https"
      - "traefik.http.routers.web.tls=true"
      - "traefik.http.services.web.loadbalancer.server.port=80"

  admin:
    build:
      context: ..
      dockerfile: docker/Dockerfile.admin
      args:
        VITE_API_URL: https://api.${DOMAIN}
        VITE_BRAND_NAME: ${BRAND_NAME:-Directory SaaS}
        VITE_BRAND_HUE: ${BRAND_HUE:-230}
    container_name: directory-saas-admin
    restart: unless-stopped
    networks:
      - internal
      - coolify
    depends_on:
      - api
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80/"]
      interval: 30s
      timeout: 5s
      retries: 3
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.admin.rule=Host(`admin.${DOMAIN}`)"
      - "traefik.http.routers.admin.entrypoints=https"
      - "traefik.http.routers.admin.tls=true"
      - "traefik.http.services.admin.loadbalancer.server.port=80"

  provider-portal:
    build:
      context: ..
      dockerfile: docker/Dockerfile.provider
      args:
        VITE_API_URL: https://api.${DOMAIN}
        VITE_BRAND_NAME: ${BRAND_NAME:-Directory SaaS}
        VITE_BRAND_HUE: ${BRAND_HUE:-230}
    container_name: directory-saas-provider
    restart: unless-stopped
    networks:
      - internal
      - coolify
    depends_on:
      - api
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80/"]
      interval: 30s
      timeout: 5s
      retries: 3
    labels:
      - "traefik.enable=true"
      # Wildcard: any subdomain not matched by api/web/admin → provider portal
      # Priority lower than specific subdomain routes
      - "traefik.http.routers.provider.rule=HostRegexp(`{subdomain:[a-z0-9-]+}.${DOMAIN}`) && !Host(`api.${DOMAIN}`) && !Host(`app.${DOMAIN}`) && !Host(`admin.${DOMAIN}`)"
      - "traefik.http.routers.provider.entrypoints=https"
      - "traefik.http.routers.provider.tls=true"
      - "traefik.http.routers.provider.priority=1"
      - "traefik.http.services.provider.loadbalancer.server.port=80"

  postgres:
    image: pgvector/pgvector:pg16
    container_name: directory-saas-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-directory}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB:-directory_saas}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./postgres/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - internal
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-directory}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: directory-saas-redis
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD} --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    networks:
      - internal
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio:latest
    container_name: directory-saas-minio
    restart: unless-stopped
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data
    networks:
      - internal
      - coolify
    healthcheck:
      test: ["CMD", "mc", "ready", "local"]
      interval: 10s
      timeout: 5s
      retries: 5
    labels:
      - "traefik.enable=true"
      # MinIO API (for public file access via presigned URLs)
      - "traefik.http.routers.minio.rule=Host(`s3.${DOMAIN}`)"
      - "traefik.http.routers.minio.entrypoints=https"
      - "traefik.http.routers.minio.tls=true"
      - "traefik.http.services.minio.loadbalancer.server.port=9000"

  meilisearch:
    image: getmeili/meilisearch:v1.12
    container_name: directory-saas-meilisearch
    restart: unless-stopped
    environment:
      MEILI_MASTER_KEY: ${MEILI_MASTER_KEY}
      MEILI_ENV: production
      MEILI_MAX_INDEXING_MEMORY: 512MiB
    volumes:
      - meilisearch_data:/meili_data
    networks:
      - internal
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--spider", "http://localhost:7700/health"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
  minio_data:
  meilisearch_data:

networks:
  internal:
    driver: bridge
  coolify:
    external: true
```

### 47.2 Production Environment Template

Create `docker/.env.production.example`:

```env
# =============================================================================
# Directory SaaS — Production Environment Variables
# Copy to .env and fill in all values
# =============================================================================

# Domain (no protocol, no trailing slash)
DOMAIN=example.com

# Brand
BRAND_NAME=Directory SaaS
BRAND_HUE=230

# CORS — list all app origins
CORS_ORIGINS=https://app.example.com,https://admin.example.com

# PostgreSQL
POSTGRES_USER=directory
POSTGRES_PASSWORD=CHANGE_ME_STRONG_PASSWORD
POSTGRES_DB=directory_saas

# Redis
REDIS_PASSWORD=CHANGE_ME_STRONG_PASSWORD

# JWT — generate with: openssl rand -base64 64
JWT_SECRET=CHANGE_ME_LONG_RANDOM_STRING
JWT_REFRESH_SECRET=CHANGE_ME_DIFFERENT_LONG_RANDOM_STRING
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# MinIO / S3
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=CHANGE_ME_STRONG_PASSWORD
S3_BUCKET=directory-saas
S3_REGION=us-east-1
S3_PUBLIC_URL=https://s3.example.com

# Meilisearch — generate with: openssl rand -hex 32
MEILI_MASTER_KEY=CHANGE_ME_RANDOM_HEX_STRING

# SMTP (example: Amazon SES, Postmark, Resend, etc.)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=CHANGE_ME
SMTP_FROM=noreply@example.com
SMTP_SECURE=true

# Logging
LOG_LEVEL=info

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

### 47.3 Nginx Configuration for SPAs

Create separate nginx configs for each SPA. The key requirements:
- SPA fallback: `try_files $uri $uri/ /index.html`
- Gzip compression
- Static asset caching (1 year for hashed files)
- Security headers
- API proxy pass for development convenience (optional, Traefik handles in prod)

**docker/nginx/web.conf:**

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/xml+rss application/atom+xml image/svg+xml;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # Hashed static assets — cache 1 year
    location ~* \.(?:js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|ico|webp|avif)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # index.html — never cache (SPA entry point)
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "OK";
        add_header Content-Type text/plain;
    }
}
```

**docker/nginx/admin.conf** — Same as web.conf (identical SPA serving pattern).

**docker/nginx/provider.conf** — Same as web.conf. The provider portal SPA reads the subdomain from `window.location.hostname` and sends it as `X-Tenant-Slug` header to the API. This is handled in the frontend code (already implemented in provider-portal app), not nginx.

Update the Dockerfiles for each SPA to `COPY` the correct nginx config:

```dockerfile
# In Dockerfile.web:
COPY docker/nginx/web.conf /etc/nginx/conf.d/default.conf

# In Dockerfile.admin:
COPY docker/nginx/admin.conf /etc/nginx/conf.d/default.conf

# In Dockerfile.provider:
COPY docker/nginx/provider.conf /etc/nginx/conf.d/default.conf
```

### 47.4 Backend Production Configuration

Ensure the backend `config/` module handles production settings:

- `NODE_ENV=production` → structured JSON logging (Pino), no pretty printing
- `CORS_ORIGINS` → parsed as comma-separated list, set on NestJS CORS config
- Connection pooling: Prisma default pool size is fine for production (10 connections); document `?connection_limit=20` option in DATABASE_URL
- Rate limiting: tuned via `THROTTLE_TTL` and `THROTTLE_LIMIT` env vars
- JWT secrets: validated as non-empty, minimum length
- Health check endpoint: `/api/v1/health` with readiness probe (checks DB, Redis, Meilisearch)

### 47.5 Provider Subdomain Routing

The subdomain routing works as follows in production:

1. **DNS**: Cloudflare wildcard DNS `*.example.com` → VPS IP
2. **Traefik** (Coolify's reverse proxy): Routes based on labels
   - `api.example.com` → api service
   - `app.example.com` → web SPA
   - `admin.example.com` → admin SPA
   - `{anything-else}.example.com` → provider-portal SPA (wildcard rule with low priority)
3. **Provider Portal SPA**: JavaScript reads `window.location.hostname`, extracts subdomain, stores as tenant slug
4. **API requests**: Provider portal sends `X-Tenant-Slug: {subdomain}` header on all API calls
5. **Backend**: `TenantResolutionMiddleware` resolves tenant from `X-Tenant-Slug` header (already implemented)

Document that the wildcard DNS must be configured in Cloudflare:
- Type: A record
- Name: `*`
- Content: VPS IP address
- Proxy status: Proxied (orange cloud) for SSL

### 47.6 SSL Configuration

SSL is handled automatically by the Cloudflare + Coolify combination:
- Cloudflare provides edge SSL (client → Cloudflare)
- Coolify/Traefik provides origin SSL (Cloudflare → server) via Let's Encrypt or Cloudflare origin certificates
- Configure Cloudflare SSL mode to "Full (strict)" for end-to-end encryption

Document this in the deployment guide — no manual SSL certificate management needed.

### 47.7 Deployment Script

Create `scripts/deploy.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

# Directory SaaS — Production Deployment Script
# Usage: ./scripts/deploy.sh [build|deploy|migrate|seed|status|logs]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DOCKER_DIR="$PROJECT_DIR/docker"
COMPOSE_FILE="$DOCKER_DIR/docker-compose.coolify.yml"

# Load environment
if [ -f "$DOCKER_DIR/.env" ]; then
  set -a
  source "$DOCKER_DIR/.env"
  set +a
fi

DOMAIN="${DOMAIN:-localhost}"

function log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

function cmd_build() {
  log "Building Docker images..."
  docker compose -f "$COMPOSE_FILE" build --no-cache "$@"
  log "Build complete."
}

function cmd_deploy() {
  log "Deploying to $DOMAIN..."

  # Build images
  docker compose -f "$COMPOSE_FILE" build

  # Start/restart services
  docker compose -f "$COMPOSE_FILE" up -d

  # Wait for API health
  log "Waiting for API to be healthy..."
  local retries=30
  while [ $retries -gt 0 ]; do
    if docker compose -f "$COMPOSE_FILE" exec api curl -sf http://localhost:3000/api/v1/health > /dev/null 2>&1; then
      log "API is healthy!"
      break
    fi
    retries=$((retries - 1))
    sleep 2
  done

  if [ $retries -eq 0 ]; then
    log "ERROR: API did not become healthy in time"
    docker compose -f "$COMPOSE_FILE" logs api --tail=50
    exit 1
  fi

  log "Deployment complete!"
  cmd_status
}

function cmd_migrate() {
  log "Running database migrations..."
  docker compose -f "$COMPOSE_FILE" exec api npx prisma migrate deploy
  log "Migrations complete."
}

function cmd_seed() {
  log "Seeding database..."
  docker compose -f "$COMPOSE_FILE" exec api npx prisma db seed
  log "Seed complete."
}

function cmd_status() {
  log "Service status:"
  docker compose -f "$COMPOSE_FILE" ps
  echo ""
  log "Endpoints:"
  echo "  API:      https://api.$DOMAIN"
  echo "  Web App:  https://app.$DOMAIN"
  echo "  Admin:    https://admin.$DOMAIN"
  echo "  Provider: https://{slug}.$DOMAIN"
}

function cmd_logs() {
  docker compose -f "$COMPOSE_FILE" logs -f "${1:-}"
}

function cmd_stop() {
  log "Stopping services..."
  docker compose -f "$COMPOSE_FILE" down
  log "Services stopped."
}

# Main
case "${1:-help}" in
  build)   shift; cmd_build "$@" ;;
  deploy)  cmd_deploy ;;
  migrate) cmd_migrate ;;
  seed)    cmd_seed ;;
  status)  cmd_status ;;
  logs)    shift; cmd_logs "${1:-}" ;;
  stop)    cmd_stop ;;
  *)
    echo "Usage: $0 {build|deploy|migrate|seed|status|logs|stop}"
    echo ""
    echo "Commands:"
    echo "  build    Build Docker images"
    echo "  deploy   Build, start services, wait for health"
    echo "  migrate  Run Prisma migrations"
    echo "  seed     Seed the database"
    echo "  status   Show service status and endpoints"
    echo "  logs     Tail service logs (optionally specify service name)"
    echo "  stop     Stop all services"
    exit 1
    ;;
esac
```

### 47.8 Deployment Documentation

Create `docs/deployment.md`:

Document the full deployment process:

1. **Prerequisites**: VPS with Docker, Coolify installed, domain pointed to VPS
2. **DNS Setup**: Cloudflare A records (root domain + wildcard)
3. **Environment Setup**: Copy `.env.production.example` → `.env`, fill in values
4. **Deploy**: `./scripts/deploy.sh deploy`
5. **Migrate**: `./scripts/deploy.sh migrate`
6. **Seed** (first deploy only): `./scripts/deploy.sh seed`
7. **Verify**: Check all endpoints
8. **SSL**: Cloudflare SSL mode → Full (strict)
9. **Monitoring**: `./scripts/deploy.sh logs`, `./scripts/deploy.sh status`
10. **Updates**: Pull latest code → `./scripts/deploy.sh deploy` → `./scripts/deploy.sh migrate`

Include troubleshooting section for common issues.

## Acceptance Criteria
- [ ] `docker-compose.coolify.yml` defines all services with health checks
- [ ] Traefik labels route `api.{DOMAIN}` → backend API
- [ ] Traefik labels route `app.{DOMAIN}` → web SPA
- [ ] Traefik labels route `admin.{DOMAIN}` → admin SPA
- [ ] Traefik wildcard rule routes `*.{DOMAIN}` → provider portal (excluding api/app/admin)
- [ ] All services on internal network for inter-service communication
- [ ] API and SPA services on coolify network for Traefik access
- [ ] Nginx configs serve SPAs with gzip, caching, SPA fallback, security headers
- [ ] `.env.production.example` documents ALL required environment variables
- [ ] No secrets in example file — only templates/placeholders
- [ ] Backend CORS configured for all app domains
- [ ] Deployment script (`scripts/deploy.sh`) handles build, deploy, migrate, seed, status, logs
- [ ] Deployment documentation covers full process from DNS to running app
- [ ] Provider subdomain resolution works end-to-end (subdomain → SPA → API header → tenant context)
- [ ] SSL documented (Cloudflare + Coolify automatic)
- [ ] Domain is configurable via `DOMAIN` env var — not hardcoded anywhere

## Files to Create/Modify
- `docker/docker-compose.coolify.yml` (rewrite)
- `docker/.env.production.example` (create)
- `docker/nginx/web.conf` (create)
- `docker/nginx/admin.conf` (create)
- `docker/nginx/provider.conf` (create)
- `docker/nginx/spa.conf` (may remove if replaced by per-app configs)
- `docker/Dockerfile.web` (update — COPY correct nginx config)
- `docker/Dockerfile.admin` (update — COPY correct nginx config)
- `docker/Dockerfile.provider` (update — COPY correct nginx config)
- `scripts/deploy.sh` (create)
- `docs/deployment.md` (create)

## Dependencies
- Tasks 01-27 (backend complete)
- Tasks 28-40 (frontend apps complete)
- Task 26: Docker Compose (base Docker setup)

## KNOWN ISSUES & SOLUTIONS (check FIRST before debugging)

# Known Issues & Solutions

> When you encounter an issue, check here FIRST. If documented, follow the solution exactly.
> After fixing a NEW issue, append it here following the format below.

---

## Format

```
### Issue: [Short description]
**Symptom:** What you see
**Root Cause:** Why it happens
**Solution:** How to fix it
**DO NOT:** What NOT to do as a workaround
```

---

## NestJS & TypeScript

### Issue: Circular dependency injection
**Symptom:** `Nest can't resolve dependencies of the XService`
**Root Cause:** Module A imports Module B which imports Module A
**Solution:** Use `forwardRef(() => ModuleA)` in the imports array of the dependent module. Better yet, use the event system for cross-module communication.
**DO NOT:** Never suppress the error with `@Optional()` decorator

### Issue: Prisma client not generated
**Symptom:** `Cannot find module '.prisma/client'` or type errors on Prisma models
**Root Cause:** `npx prisma generate` hasn't been run after schema changes
**Solution:** Run `cd backend && npx prisma generate` after any schema.prisma changes
**DO NOT:** Never copy-paste Prisma types manually

### Issue: Zod schema doesn't match Prisma types
**Symptom:** TypeScript errors when passing Zod-validated data to Prisma
**Root Cause:** Zod schema and Prisma model are out of sync
**Solution:** Keep Zod schemas as the source of truth for input validation. Prisma types are for DB operations. Map between them explicitly in the service layer.
**DO NOT:** Never use `as any` to bypass type mismatches

---

## Database & Migrations

### Issue: Migration fails with "relation already exists"
**Symptom:** `npx prisma migrate dev` fails
**Root Cause:** Database state doesn't match migration history
**Solution:** Run `npx prisma migrate reset` in development (destroys data). In production, create a custom migration to reconcile.
**DO NOT:** Never delete migration files from the migrations directory

### Issue: UUID extension not available
**Symptom:** `function uuid_generate_v4() does not exist`
**Root Cause:** `uuid-ossp` extension not installed
**Solution:** Ensure `docker/postgres/init.sql` runs `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`. Prisma uses `@default(uuid())` which maps to `gen_random_uuid()` (built-in to PG 13+), not uuid-ossp.
**DO NOT:** Never hardcode UUIDs in migrations

---

## Docker & Deployment

### Issue: Coolify containers can't communicate
**Symptom:** Backend can't reach PostgreSQL or Redis in Coolify deployment
**Root Cause:** Containers not on the `coolify` external network
**Solution:** Add `networks: [internal, coolify]` to services that need external access. Ensure `coolify` network is declared as `external: true`.
**DO NOT:** Never use `network_mode: host` in production

### Issue: Nginx SPA returns 404 on direct URL access
**Symptom:** Navigating to `/dashboard` directly returns 404
**Root Cause:** Nginx tries to find a file at `/dashboard` instead of serving `index.html`
**Solution:** Use `try_files $uri $uri/ /index.html;` in nginx config
**DO NOT:** Never add individual `location` blocks for each route

---

## Testing

### Issue: Tests fail with database connection error
**Symptom:** `connect ECONNREFUSED 127.0.0.1:5432` in test runs
**Root Cause:** Test database not running or wrong TEST_DATABASE_URL
**Solution:** Start Docker services first (`cd docker && docker compose up -d postgres redis`). Ensure `.env.test` has correct `TEST_DATABASE_URL`.
**DO NOT:** Never run tests against the production database

---

_Add new issues below this line, following the format above._

## ERROR HANDLING POLICY (CRITICAL — NO WORKAROUNDS)

- NEVER use workarounds, hacks, or shortcuts to bypass errors
- NEVER use `// @ts-ignore`, `any` type, `--no-verify`, or `--force` to make things pass
- NEVER skip a failing step — fix the root cause
- If a build fails, read the FULL error, understand WHY, and fix the source
- If a test fails, fix the code or the test — never delete or skip tests
- If a migration fails, understand the schema mismatch and resolve it
- Take your time. Research the issue. Read relevant source files. Fix it properly.
- After resolving any non-trivial issue, document it in scripts/known-issues.md

## INSTRUCTIONS

1. Read the task specification carefully. Implement ALL items.
2. Follow the coding standards exactly — especially naming, file structure, and patterns.
3. Write tests as specified in the task (unit + e2e where applicable).
4. After completing the implementation, verify by:
   - Running: cd backend && npm run build (must succeed with 0 errors)
   - Running: cd backend && npm test (tests must pass)
   - If either fails, FIX the errors — do not proceed with a broken build
5. After ALL work is done, update the progress file at docs/tasks/progress.json:
   - Set tasks.47-production-deployment.status to "completed"
   - Set each subtask to "completed" as you finish them
   - Set tasks.47-production-deployment.completed_at to current ISO timestamp
   - Add any important notes to tasks.47-production-deployment.notes
6. Finally, create a git commit with message: "feat: implement 47-production-deployment — Production Deployment — Coolify, Domain Routing, SSL"

DO NOT skip any part of the task. Implement everything listed in the spec.
If you encounter a blocker, update progress.json notes field with the issue and set status to "failed".
