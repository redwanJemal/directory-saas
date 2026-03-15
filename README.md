# Directory SaaS

Production-grade SaaS starter for building **directory and marketplace platforms**. Built with NestJS, Prisma, React, and TypeScript. Multi-tenant, AI-ready, with enterprise patterns for auth, search, jobs, and observability.

> Skip months of boilerplate. Start building your directory features on day one.

## Highlights

- **Multi-tenant from day one** — subdomain resolution, PostgreSQL Row-Level Security, tenant-scoped everything
- **3 frontend apps** — client portal, provider dashboard, admin panel (React + Vite + Tailwind + shadcn/ui)
- **Enterprise auth** — JWT + refresh token rotation, 3 user types, RBAC with granular permissions
- **AI-ready** — Vercel AI SDK with Anthropic/OpenAI, SSE streaming, tool system
- **Full-text + semantic search** — Meilisearch + pgvector hybrid search
- **Background jobs** — BullMQ with 6 named queues, Bull Board dashboard
- **Production Docker** — multi-stage builds, Coolify-ready compose files
- **729 unit tests** — Jest + factories + E2E test infrastructure

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | NestJS 11, Prisma 6, PostgreSQL 16 (pgvector), Redis 7 |
| **Frontend** | React 19, Vite 7, TypeScript, Tailwind CSS 4, shadcn/ui |
| **Auth** | JWT access tokens (15m) + refresh token rotation (7d) |
| **Validation** | Zod end-to-end (no class-validator) |
| **State** | TanStack Query (server) + Zustand (client) |
| **Jobs** | BullMQ + Redis (email, notification, export, cleanup, indexing, ai) |
| **Search** | Meilisearch (full-text) + pgvector (semantic/hybrid) |
| **AI** | Vercel AI SDK v6 (Anthropic/OpenAI), SSE streaming, tool system |
| **Email** | Nodemailer + SMTP (Mailpit in dev) |
| **Logging** | Pino (structured JSON), correlation IDs |
| **Deploy** | Docker + Coolify |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                           │
│   Web App (:3000)  ·  Provider Portal (:3001)  ·  Admin (:3002)  │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/REST + SSE
┌──────────────────────────┼──────────────────────────────────┐
│                   NestJS Backend (:3333)                     │
│                                                              │
│  Middleware:  CorrelationId → RequestLogging → SecurityHeaders│
│              → TenantResolution                              │
│  Guards:     Throttler → JWT → Roles → PlanLimit → Feature   │
│  Pipes:      ZodValidation · QueryParameters · Sanitize      │
│  Interceptors: Transform · TenantScope · Audit               │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────┐
│                      Data Layer                              │
│  PostgreSQL+pgvector · Redis · MinIO · Meilisearch · Mailpit │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 22+ |
| Docker & Compose | 24+ / 2.20+ |
| Git | 2.40+ |

### 1. Clone & Install

```bash
git clone https://github.com/redwanJemal/directory-saas.git
cd directory-saas

# Backend
cd backend && npm install && cd ..

# Frontends
cd apps/web && npm install && cd ../..
cd apps/provider-portal && npm install && cd ../..
cd apps/admin && npm install && cd ../..
```

### 2. Environment

```bash
cp .env.example backend/.env
# Defaults work out of the box with Docker services
```

### 3. Start Infrastructure

```bash
cd docker && docker compose up -d
```

Starts PostgreSQL (pgvector), Redis, MinIO, Meilisearch, and Mailpit.

### 4. Database Setup

```bash
cd backend
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

The seed creates:
- **Admin**: `admin@directory-saas.local` / `admin123456`
- **3 plans**: Starter (free), Professional ($49/mo), Enterprise ($199/mo)
- **Demo tenant** with default roles (OWNER, ADMIN, MANAGER, MEMBER)

### 5. Run

```bash
# Backend (port 3333)
cd backend && npm run start:dev

# Frontend — pick one or all
cd apps/web && npm run dev              # :3000
cd apps/provider-portal && npm run dev  # :3001
cd apps/admin && npm run dev            # :3002
```

### 6. Verify

```bash
curl http://localhost:3333/api/v1/health
# → {"success":true,"data":{"status":"ok"}}

curl http://localhost:3333/api/v1/health/ready
# → checks postgres, redis, minio, meilisearch
```

## Project Structure

```
backend/src/
├── common/           # Shared infrastructure (guards, pipes, interceptors, services)
├── modules/
│   ├── ai/           # Vercel AI SDK chat, tools, conversations
│   ├── audit/        # Audit logging with entity change tracking
│   ├── auth/         # JWT + refresh tokens, 3 login flows
│   ├── events/       # EventEmitter2 domain event system
│   ├── health/       # Liveness + readiness probes
│   ├── jobs/         # BullMQ queues, processors, Bull Board
│   ├── notifications/# In-app notifications, email templates
│   ├── roles/        # RBAC roles + permissions CRUD
│   ├── search/       # Meilisearch + pgvector unified search
│   ├── subscriptions/# Plans, subscriptions, usage tracking
│   └── uploads/      # MinIO/S3 file uploads, presigned URLs
├── prisma/           # PrismaModule + PrismaService (RLS extensions)
└── config/           # Zod config schema + AppConfigService

apps/
├── web/              # End client SPA
├── provider-portal/  # Provider dashboard
└── admin/            # Platform admin

docker/
├── docker-compose.yml          # Dev infrastructure
├── docker-compose.coolify.yml  # Production stack
├── Dockerfile.api              # Multi-stage NestJS build
├── Dockerfile.web/provider/admin  # React + nginx
└── nginx/default.conf          # SPA fallback, gzip, caching
```

## Key Patterns

### ServiceResult — Services Never Throw

```typescript
// Service returns ServiceResult<T>
async create(dto: CreateTenantDto): Promise<ServiceResult<Tenant>> {
  if (exists) return ServiceResult.fail('ALREADY_EXISTS', 'Tenant exists');
  const tenant = await this.prisma.tenant.create({ data: dto });
  return ServiceResult.ok(tenant);
}

// Controller converts to HTTP
const result = await this.service.create(dto);
if (!result.success) throw result.toHttpException();
return result.data;
```

### Zod Validation — No class-validator

```typescript
export const CreateTenantSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/),
});
export type CreateTenantDto = z.infer<typeof CreateTenantSchema>;
```

### Multi-Tenancy

- **Resolution**: subdomain → `X-Tenant-ID` header → `X-Tenant-Slug` header → JWT
- **Database isolation**: PostgreSQL RLS on all tenant-scoped tables
- **Write scoping**: `TenantScopeInterceptor` auto-injects `tenantId`
- **PrismaService**: `.rls` (auto), `.rlsBypass` (admin), `.forTenant(id)` (explicit)

### Response Envelope

All responses wrapped automatically:

```json
// Success
{ "success": true, "data": { ... }, "timestamp": "...", "traceId": "..." }

// Paginated
{ "success": true, "data": [...], "pagination": { "page": 1, "pageSize": 20, "totalCount": 100, "totalPages": 5 } }

// Error
{ "success": false, "error": { "code": "NOT_FOUND", "message": "..." } }
```

### Query Parameters (Bracket Notation)

```
GET /api/v1/providers?filter[status]=active,verified&filter[rating][gte]=4.0&sort=-rating,name&page=1&pageSize=20&include=reviews
```

## Auth System

Three separate auth flows for three user types:

| User Type | Endpoint | Use Case |
|-----------|----------|----------|
| **AdminUser** | `POST /auth/admin/login` | Platform administration |
| **TenantUser** | `POST /auth/tenant/login` | Provider/business management |
| **ClientUser** | `POST /auth/client/login` | End-user directory access |

- JWT access tokens (15 min) + refresh token rotation (7 days)
- Refresh tokens stored hashed (SHA-256), max 5 per user
- RBAC with `{resource}:{action}` permissions (e.g., `providers:read`, `users:write`)
- Default roles per tenant: OWNER, ADMIN, MANAGER, MEMBER

## Subscription Plans

| Plan | Price | Users | Features |
|------|-------|-------|----------|
| Starter | Free | 3 | Basic features |
| Professional | $49/mo | 25 | AI planner, advanced analytics |
| Enterprise | $199/mo | Unlimited | All features, priority support |

Enforced at the guard level with `@PlanLimit('users')` and `@FeatureGate('ai-planner')`.

## Background Jobs

6 BullMQ queues backed by Redis:

| Queue | Purpose |
|-------|---------|
| `email` | Transactional emails (welcome, password reset, invites) |
| `notification` | In-app notification delivery |
| `export` | Data export generation |
| `cleanup` | Token cleanup, expired data removal |
| `indexing` | Meilisearch index sync |
| `ai` | AI processing tasks |

Dashboard: `http://localhost:3333/api/v1/admin/queues` (requires admin auth)

## Search

Three search modes via unified API:

- **Full-text** — Meilisearch with typo tolerance, faceted filtering
- **Semantic** — pgvector cosine similarity with embeddings
- **Hybrid** — both engines, merged and ranked results

Entity changes automatically trigger reindexing via the event system and BullMQ indexing queue.

## Development Tools

| Tool | URL | Purpose |
|------|-----|---------|
| Swagger Docs | http://localhost:3333/api/docs | Interactive API explorer |
| Bull Board | http://localhost:3333/api/v1/admin/queues | Job queue dashboard |
| Mailpit | http://localhost:8025 | Email testing UI |
| MinIO Console | http://localhost:9001 | File storage browser |
| Meilisearch | http://localhost:7700 | Search dashboard |
| Prisma Studio | `npx prisma studio` → :5555 | Visual DB browser |

## Common Commands

```bash
# Development
cd backend && npm run start:dev       # Backend with hot reload
cd backend && npm run build           # Build (must pass with 0 errors)

# Testing
cd backend && npm test                # 729 unit tests
cd backend && npm run test:e2e        # E2E tests
cd backend && npm run test:cov        # Coverage report

# Database
cd backend && npx prisma migrate dev --name description  # New migration
cd backend && npx prisma db seed     # Seed (idempotent)
cd backend && npx prisma studio      # Visual DB browser

# Code Quality
cd backend && npm run lint           # ESLint
cd backend && npm run format         # Prettier
./scripts/validate-standards.sh      # Coding standards check

# Docker
cd docker && docker compose up -d    # Start dev infrastructure
cd docker && docker compose down     # Stop all

# Production
cd docker && docker compose -f docker-compose.coolify.yml up -d
```

## Deployment

### Production (Coolify)

The project includes a production-ready `docker-compose.coolify.yml` with:

- Multi-stage Docker builds (node:22-alpine → nginx:alpine for SPAs)
- Health checks on all services
- Persistent volumes for PostgreSQL, Redis, MinIO, Meilisearch
- Internal networking with Coolify reverse proxy integration
- Environment variable configuration for all services

```bash
cd docker && docker compose -f docker-compose.coolify.yml up -d
```

## Adding a New Module

1. Create `backend/src/modules/{name}/`
2. Define Zod DTOs in `dto/` subdirectory
3. Create service returning `ServiceResult<T>`
4. Create controller with guards and validation pipes
5. Create NestJS module, register in `app.module.ts`
6. Add Prisma model with `@@map`, timestamps, indexes
7. Run `npx prisma migrate dev --name add_{name}_table`
8. Write tests: `{name}.service.spec.ts` + `{name}.e2e-spec.ts`

See [CLAUDE.md](./CLAUDE.md) for detailed conventions.

## Documentation

- [Getting Started](./docs/getting-started.md) — Setup in under 15 minutes
- [Architecture](./docs/architecture.md) — System design, data flow, diagrams
- [API Conventions](./docs/api-conventions.md) — Endpoint patterns, filtering, pagination
- [Coding Standards](./scripts/coding-standards.md) — Code style and patterns

## License

UNLICENSED — Private project.
