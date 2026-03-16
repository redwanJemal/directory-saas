# Directory SaaS Boilerplate

## Overview
Reusable, production-grade SaaS starter for building directory/marketplace platforms.
NestJS + Prisma + React + TypeScript. Multi-tenant, AI-ready, with enterprise patterns
for auth, search, jobs, and observability.

## Tech Stack
- **Backend**: NestJS 11, Prisma 6, PostgreSQL 16 (pgvector), Redis 7
- **Frontend**: React 19, Vite 7, TypeScript, Tailwind CSS 4, shadcn/ui
- **Auth**: JWT access tokens (15m) + refresh token rotation (7d), 3 user types (AdminUser, TenantUser, ClientUser)
- **Multi-tenancy**: Subdomain + header resolution, PostgreSQL RLS on all tenant-scoped tables
- **Validation**: Zod end-to-end (NO class-validator)
- **State**: TanStack Query (server) + Zustand (client)
- **Jobs**: BullMQ + Redis (6 queues: email, notification, export, cleanup, indexing, ai)
- **Search**: Meilisearch (full-text) + pgvector (semantic/hybrid)
- **AI**: Vercel AI SDK v6 (Anthropic/OpenAI), SSE streaming, tool system
- **Email**: Nodemailer + SMTP (Mailpit in dev)
- **Logging**: Pino (structured JSON in prod, pretty in dev), correlation IDs
- **Deploy**: Docker + Coolify

## Project Structure
```
backend/src/
├── common/                # Shared infrastructure (NEVER domain logic)
│   ├── constants/         # Error codes, app constants
│   ├── decorators/        # @CurrentUser, @CurrentTenant, @Public, @Roles, @RequirePermission
│   ├── dto/               # QueryParametersDto, PaginationDto, ApiResponseDto
│   ├── exceptions/        # AppException, ServiceResult
│   ├── filters/           # GlobalExceptionFilter
│   ├── guards/            # JwtAuthGuard, RolesGuard, PlanLimitGuard, ThrottlerGuard
│   ├── interceptors/      # TransformInterceptor, TenantScopeInterceptor, AuditInterceptor
│   ├── middleware/         # TenantResolutionMiddleware, CorrelationIdMiddleware, SecurityHeaders
│   ├── pipes/             # QueryParametersPipe, ZodValidationPipe, SanitizePipe
│   ├── services/          # CacheService, StorageService, EmailService, LoggerService, RedisService
│   └── types/             # Shared TypeScript types/interfaces
├── modules/               # Domain modules
│   ├── ai/                # Vercel AI SDK chat, tools, conversations
│   ├── audit/             # Audit logging with entity change tracking
│   ├── auth/              # JWT + refresh tokens, 3 login flows
│   ├── events/            # EventEmitter2 domain event system
│   ├── health/            # Liveness + readiness probes
│   ├── jobs/              # BullMQ queues, processors, Bull Board dashboard
│   ├── notifications/     # In-app notifications, email templates
│   ├── roles/             # RBAC roles + permissions CRUD
│   ├── search/            # Meilisearch + pgvector unified search
│   ├── subscriptions/     # Plans, tenant subscriptions, usage tracking
│   └── uploads/           # MinIO/S3 file uploads, presigned URLs
├── prisma/                # PrismaModule + PrismaService (with RLS extensions)
├── config/                # Zod config schema + AppConfigService
├── app.module.ts
└── main.ts

apps/
├── web/                   # End client SPA (:3000 dev)
├── provider-portal/       # Provider dashboard (:3001 dev)
├── admin/                 # Platform admin (:3002 dev)

docker/
├── docker-compose.yml           # Dev infrastructure (postgres, redis, minio, meilisearch, mailpit)
├── docker-compose.coolify.yml   # Production stack (api + 3 SPAs + infra)
├── Dockerfile.api               # Multi-stage NestJS build
├── Dockerfile.web               # React + nginx
├── Dockerfile.provider          # React + nginx
├── Dockerfile.admin             # React + nginx
└── nginx/default.conf           # SPA fallback, gzip, caching

scripts/
├── task-runner.sh               # Task execution
├── validate-standards.sh        # Coding standards checker
└── coding-standards.md          # Full coding standards reference

docs/
├── api-conventions.md           # API design patterns + examples
├── architecture.md              # System architecture guide
├── getting-started.md           # Onboarding (dev setup in < 15 min)
└── tasks/                       # Task definitions + progress tracking
```

## Key Patterns

### ServiceResult<T>
Services never throw. They return `ServiceResult<T>` with `{ success, data, error }`.
Controllers convert failures to HTTP exceptions via `result.toHttpException()`.

```typescript
// Service
async create(dto: CreateTenantDto): Promise<ServiceResult<Tenant>> {
  if (exists) return ServiceResult.fail('ALREADY_EXISTS', 'Tenant exists');
  const tenant = await this.prisma.tenant.create({ data: dto });
  return ServiceResult.ok(tenant);
}

// Controller
const result = await this.service.create(dto);
if (!result.success) throw result.toHttpException();
return result.data; // TransformInterceptor wraps in envelope
```

### Zod DTOs
Always define Zod schema first, then infer DTO type. Never use class-validator.

```typescript
export const CreateTenantSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/),
});
export type CreateTenantDto = z.infer<typeof CreateTenantSchema>;
```

### Response Envelope
All responses wrapped by TransformInterceptor:
- Success: `{ success: true, data, timestamp, traceId }`
- Paginated: `{ success: true, data: [], pagination: { page, pageSize, totalCount, totalPages }, timestamp, traceId }`
- Error: `{ success: false, error: { code, message, details }, timestamp, traceId }`

### Query Parameters (Bracket Notation)
```
GET /api/v1/providers?filter[status]=active,verified&filter[rating][gte]=4.0&sort=-rating,name&page=1&pageSize=20&include=reviews
```
Operators: `eq`, `gt`, `gte`, `lt`, `lte`, `contains`, `startsWith`, `endsWith`, `in`, `isNull`

### Tenant Scoping
- Resolved via: subdomain > X-Tenant-ID header > X-Tenant-Slug header > JWT tenantId
- All tenant-scoped Prisma queries include `tenantId` in WHERE
- PostgreSQL RLS enforced on 6 tables via `app.current_tenant_id` session variable
- PrismaService exposes `.rls` (auto from RequestContext), `.rlsBypass` (admin), `.forTenant(id)`

### Cache Keys
Pattern: `saas:{tenantId}:{namespace}:{key}` (platform: `saas:_platform:{namespace}:{key}`)

### Error Codes
Defined in `common/constants/error-codes.ts`. Standard codes: `UNAUTHORIZED`, `FORBIDDEN`, `TOKEN_EXPIRED`, `VALIDATION_ERROR`, `NOT_FOUND`, `ALREADY_EXISTS`, `TENANT_NOT_FOUND`, `PLAN_LIMIT_REACHED`, `RATE_LIMIT_EXCEEDED`, `INTERNAL_ERROR`.

## Database Conventions
- UUIDs for all PKs: `@id @default(uuid()) @db.Uuid`
- `snake_case` tables/columns via `@@map` / `@map`
- Plural table names, singular model names
- All models: `createdAt @default(now()) @db.Timestamptz`, `updatedAt @updatedAt @db.Timestamptz`
- Soft delete: `deletedAt DateTime? @db.Timestamptz`
- Tenant-scoped models always have `tenantId String @db.Uuid`
- Decimals as `Decimal @db.Decimal(12, 2)`, never Float

### Frontend Architecture
Each frontend app follows this structure:
```
apps/{app}/src/
├── components/
│   ├── layout/          # DashboardLayout, Sidebar, Header, ProtectedRoute
│   ├── ui/              # shadcn/ui components (Button, Card, Dialog, etc.)
│   └── data-table/      # Reusable DataTable, pagination, toolbar
├── features/            # Feature modules (pages + feature-specific components)
│   ├── auth/            # LoginPage, RegisterPage
│   ├── dashboard/       # DashboardPage
│   └── {feature}/       # Feature-specific pages, dialogs, hooks
├── hooks/               # Shared hooks (useTheme, useDebounce, useMediaQuery, etc.)
├── i18n/                # i18next config + en.json, am.json translation files
├── lib/                 # api.ts, branding.ts, utils.ts, auth-types.ts
├── stores/              # Zustand stores (auth-store.ts)
├── test/                # Vitest setup, utils, MSW mocks
├── main.tsx
└── index.css            # Tailwind + OKLch theme variables
```

**Key frontend patterns:**
- **Components**: shadcn/ui based, using `cn()` for className merging, CSS variable themes
- **Auth**: Zustand store + localStorage persistence, JWT token rotation via Axios interceptor
- **Data fetching**: TanStack Query hooks in `features/*/hooks/`
- **Forms**: Zod schemas for validation + manual error display
- **i18n**: `useTranslation()` hook, dot-notation keys (`auth.login`, `common.save`)
- **Testing**: Vitest + Testing Library + MSW, custom render with QueryClient + Router providers

## How to Add a New Module

1. **Create module directory**: `backend/src/modules/{name}/`
2. **Define Zod DTOs** in `dto/create-{name}.dto.ts`, `dto/update-{name}.dto.ts`
3. **Create service** (`{name}.service.ts`): inject PrismaService, return `ServiceResult<T>`
4. **Create controller** (`{name}.controller.ts`): use `@ApiTags`, `@UseGuards`, `ZodValidationPipe`
5. **Create module** (`{name}.module.ts`): register controller + service, import PrismaModule
6. **Add Prisma model** to `backend/prisma/schema.prisma` with `@@map`, timestamps, indexes
7. **Create migration**: `cd backend && npx prisma migrate dev --name add_{name}_table`
8. **Write tests**: `{name}.service.spec.ts` (unit), `{name}.e2e-spec.ts` (E2E)
9. **Register module** in `app.module.ts`

## API Conventions
- URL pattern: `/api/v1/{resource}`, `/api/v1/tenants/:tenantId/{resource}`, `/api/v1/admin/{resource}`
- Plural nouns, kebab-case: `/api/v1/subscription-plans`
- POST → 201, GET → 200, PATCH → 200, DELETE → 200
- Auth header: `Authorization: Bearer <token>`
- Tenant header: `X-Tenant-ID: <uuid>` or `X-Tenant-Slug: <slug>`
- Rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

See `docs/api-conventions.md` for full documentation with examples.

## Common Commands
```bash
# Backend
cd backend && npm run start:dev    # Start with hot reload (port 3333)
cd backend && npm run build        # Build (must pass with 0 errors)
cd backend && npm test             # Unit tests (729 tests)
cd backend && npm run test:e2e     # E2E tests
cd backend && npm run test:cov     # Coverage report

# Frontend
cd apps/web && npm run dev         # Client SPA (:3000)
cd apps/provider-portal && npm run dev  # Provider (:3001)
cd apps/admin && npm run dev       # Admin (:3002)

# Frontend Testing
cd apps/admin && npm test              # Admin unit tests (22 tests)
cd apps/provider-portal && npm test    # Provider unit tests (22 tests)
cd apps/web && npm test                # Web unit tests (22 tests)
cd apps/admin && npm run test:cov      # Coverage report
cd apps/web && npm run test:watch      # Watch mode
cd apps/admin && npm run lint          # ESLint (0 errors required)
cd apps/provider-portal && npm run lint
cd apps/web && npm run lint

# Database
cd backend && npx prisma migrate dev --name description   # New migration
cd backend && npx prisma db seed                           # Seed (idempotent)
cd backend && npx prisma generate                          # Regenerate client
cd backend && npx prisma studio                            # Visual DB browser

# Docker (dev infrastructure)
cd docker && docker compose up -d                          # Start postgres, redis, minio, meilisearch, mailpit
cd docker && docker compose down                           # Stop all
cd docker && docker compose logs -f postgres               # View logs

# Docker (production/Coolify)
cd docker && docker compose -f docker-compose.coolify.yml up -d

# Code quality
cd backend && npm run lint                                 # ESLint
cd backend && npm run format                               # Prettier
./scripts/validate-standards.sh                            # Coding standards check

# Tasks
./scripts/task-runner.sh --status   # Show progress
./scripts/task-runner.sh --task 03  # Run specific task
./scripts/task-runner.sh            # Run next task
```

## Infrastructure Ports (Development)
| Service       | Port  | URL                          |
|---------------|-------|------------------------------|
| Backend API   | 3333  | http://localhost:3333        |
| Swagger Docs  | 3333  | http://localhost:3333/api/docs |
| Web App       | 3000  | http://localhost:3000        |
| Provider App  | 3001  | http://localhost:3001        |
| Admin App     | 3002  | http://localhost:3002        |
| PostgreSQL    | 5432  | postgresql://localhost:5432  |
| Redis         | 6379  | redis://localhost:6379       |
| MinIO API     | 9000  | http://localhost:9000        |
| MinIO Console | 9001  | http://localhost:9001        |
| Meilisearch   | 7700  | http://localhost:7700        |
| Mailpit UI    | 8025  | http://localhost:8025        |
| Mailpit SMTP  | 1025  | smtp://localhost:1025        |
| Bull Board    | 3333  | http://localhost:3333/api/v1/admin/queues |

## Coding Standards
See `scripts/coding-standards.md` for full details. Key rules:
- Zod only (no class-validator)
- Services never throw (ServiceResult pattern)
- kebab-case files, PascalCase classes, camelCase variables
- snake_case in database
- Conventional commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`

## Task System
40 tasks total. All 40 tasks completed (27 backend + 13 frontend).
See `docs/tasks/00-overview.md` for full list.
Progress tracked in `docs/tasks/progress.json`.
