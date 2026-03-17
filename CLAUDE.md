# Habesha Hub — Ethiopian Business Directory for the Middle East

## Overview
A multi-country directory platform connecting Ethiopian diaspora communities with Ethiopian-owned businesses across the Middle East. Built on the Directory SaaS boilerplate (NestJS + Prisma + React + TypeScript).

**Domain:** Ethiopian businesses in UAE, Saudi Arabia, Kuwait, Qatar, Bahrain, Oman
**Target Users:** ~1M+ Ethiopians across the Gulf states
**Key Differentiator:** Amharic-first, multi-service per business, community trust via reviews

## Tech Stack
- **Backend**: NestJS 11, Prisma 6, PostgreSQL 16 (pgvector), Redis 7
- **Frontend**: React 19, Vite 7, TypeScript, Tailwind CSS 4, shadcn/ui
- **Auth**: JWT access tokens (15m) + refresh token rotation (7d), 3 user types (AdminUser, TenantUser, ClientUser)
- **Multi-tenancy**: Each business = one tenant. Subdomain + header resolution, PostgreSQL RLS
- **Validation**: Zod end-to-end (NO class-validator)
- **State**: TanStack Query (server) + Zustand (client)
- **Jobs**: BullMQ + Redis (6 queues: email, notification, export, cleanup, indexing, ai)
- **Search**: Meilisearch (full-text) + pgvector (semantic/hybrid)
- **i18n**: English + Amharic + Arabic
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
│   ├── uploads/           # MinIO/S3 file uploads, presigned URLs
│   ├── providers/         # Provider profiles, packages, FAQs, portfolio, availability
│   ├── bookings/          # Booking/inquiry system
│   ├── reviews/           # Ratings and reviews
│   ├── categories/        # Business categories (hierarchical)
│   ├── tenants/           # Tenant management + self-service
│   └── conversations/     # Messaging between clients and providers
├── prisma/                # PrismaModule + PrismaService (with RLS extensions)
├── config/                # Zod config schema + AppConfigService
├── app.module.ts
└── main.ts

apps/
├── web/                   # Consumer-facing directory (search, browse, book, review)
├── provider-portal/       # Business owner dashboard (profile, bookings, analytics)
├── admin/                 # Platform admin (tenants, users, subscriptions, moderation)

docker/
├── docker-compose.yml           # Dev infrastructure
├── docker-compose.coolify.yml   # Production stack
├── Dockerfile.api               # Multi-stage NestJS build
├── Dockerfile.web               # React + nginx
├── Dockerfile.provider          # React + nginx
├── Dockerfile.admin             # React + nginx

scripts/
├── task-runner.sh               # Task execution
├── validate-standards.sh        # Coding standards checker
└── coding-standards.md          # Full coding standards reference
```

## Domain Model

### Business Categories (hierarchical)
```
Food & Drink          → Restaurant, Catering, Home Cook, Grocery, Bakery
Beauty & Grooming     → Salon, Barber, Braiding, Henna/Makeup, Cosmetics
Services              → PRO/Typing, Translation, Money Transfer, Travel, Cargo, Legal
Automotive            → Mechanic, Car Wash, Driving School
Health & Wellness     → Traditional Medicine, Massage/Spa, Clinic
Shopping              → Clothing, Electronics, Furniture, General Trading
Community             → Church/Mosque, Community Center, Tutoring, Events
```

### Multi-Country Support
Countries: UAE, Saudi Arabia, Kuwait, Qatar, Bahrain, Oman
Major cities per country with location-based search

### Key Customizations from Starter
1. **Multi-category per business** — businesses can tag multiple categories
2. **Multi-country/city** — country + city fields on provider profiles
3. **WhatsApp integration** — one-tap contact button
4. **Amharic + Arabic i18n** — trilingual support
5. **Business verification** — verified badge system
6. **Community features** — deals, events, job postings

## Key Patterns

### ServiceResult<T>
Services never throw. They return `ServiceResult<T>` with `{ success, data, error }`.

### Zod DTOs
Always define Zod schema first, then infer DTO type. Never use class-validator.

### Response Envelope
- Success: `{ success: true, data, timestamp, traceId }`
- Paginated: `{ success: true, data: [], pagination: { page, pageSize, totalCount, totalPages }, timestamp, traceId }`
- Error: `{ success: false, error: { code, message, details }, timestamp, traceId }`

### Tenant Scoping
- Each business = one tenant
- Resolved via: subdomain > X-Tenant-ID header > X-Tenant-Slug header > JWT tenantId
- PostgreSQL RLS enforced on all tenant-scoped tables

## Common Commands
```bash
# Backend
cd backend && npm run start:dev    # Start with hot reload (port 3333)
cd backend && npm run build        # Build (must pass with 0 errors)
cd backend && npm test             # Unit tests
cd backend && npm run test:e2e     # E2E tests

# Frontend
cd apps/web && npm run dev         # Consumer app (:3000)
cd apps/provider-portal && npm run dev  # Provider dashboard (:3001)
cd apps/admin && npm run dev       # Admin panel (:3002)

# Database
cd backend && npx prisma migrate dev --name description
cd backend && npx prisma db seed
cd backend && npx prisma generate

# Docker
cd docker && docker compose up -d
cd docker && docker compose -f docker-compose.coolify.yml up -d

# Tasks
./scripts/task-runner.sh --status   # Show progress
./scripts/task-runner.sh --task 03  # Run specific task
./scripts/task-runner.sh            # Run next task
```

## Coding Standards
See `scripts/coding-standards.md` for full details. Key rules:
- Zod only (no class-validator)
- Services never throw (ServiceResult pattern)
- kebab-case files, PascalCase classes, camelCase variables
- snake_case in database
- Conventional commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`

## Task System
See `docs/tasks/00-overview.md` for full task list.
Progress tracked in `docs/tasks/progress.json`.
Run tasks via `./scripts/task-runner.sh`.
