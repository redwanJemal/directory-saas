You are implementing task "API Integration Verification — No Demo Data, Real Endpoints" for the Directory SaaS boilerplate project.

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
  - audit-admin: pending
  - audit-provider: pending
  - audit-web: pending
  - audit-mobile: pending
  - auth-flows: pending
  - multi-tenancy: pending
  - error-handling: pending
  - build-validation: pending
  - integration-checklist: pending



## TASK SPECIFICATION

# Task 48: API Integration Verification — No Demo Data, Real Endpoints

## Summary
Audit all 4 frontend apps (admin, provider-portal, web, mobile) to ensure every page fetches data from real API endpoints with no hardcoded demo/mock data. Verify loading, empty, and error states on all pages. Verify auth flows for all 3 user types. Verify multi-tenancy isolation. Fix any issues found. Ensure all apps build with 0 TypeScript errors.

## Current State
- All 4 apps have been built across tasks 28-46
- Backend API is fully implemented with all endpoints
- Frontend apps use TanStack Query hooks to fetch data
- Some pages may still contain hardcoded placeholder data from initial development
- Auth flows exist but end-to-end verification needed
- Error handling exists but may not cover all HTTP status codes consistently

## Required Changes

### 48.1 Audit All Frontend Pages

Perform a systematic audit of every page in every app. For each page, verify:

1. **Data source**: Is it fetching from a real API endpoint? Or showing hardcoded arrays/objects?
2. **Loading state**: Does it show a skeleton/spinner while data loads?
3. **Empty state**: Does it show a meaningful message when API returns empty data?
4. **Error state**: Does it show an error message when API fails?
5. **Text**: Are all strings using `t()` (no hardcoded English text)?
6. **Colors**: Are all colors from theme (no hardcoded hex values)?

#### Admin App (`apps/admin/`) Pages to Audit:

| Page | Route | API Endpoint | Check |
|------|-------|--------------|-------|
| Dashboard | `/` | `GET /api/v1/admin/dashboard/stats` | Stats cards, charts |
| Tenants List | `/tenants` | `GET /api/v1/admin/tenants` | Data table, pagination, filters |
| Tenant Detail | `/tenants/:id` | `GET /api/v1/admin/tenants/:id` | Detail view, edit form |
| Create Tenant | `/tenants/new` | `POST /api/v1/admin/tenants` | Form submission |
| Users List | `/users` | `GET /api/v1/admin/users` | Data table |
| Roles List | `/roles` | `GET /api/v1/admin/roles` | List, permissions grid |
| Subscriptions | `/subscriptions` | `GET /api/v1/admin/subscription-plans` | Plans list, CRUD |
| Audit Logs | `/audit-logs` | `GET /api/v1/admin/audit-logs` | Data table with filters |
| Jobs Dashboard | `/jobs` | Bull Board at `/api/v1/admin/queues` | Queue stats |
| Settings | `/settings` | Various settings endpoints | Form fields |

#### Provider Portal (`apps/provider-portal/`) Pages to Audit:

| Page | Route | API Endpoint | Check |
|------|-------|--------------|-------|
| Dashboard | `/` | `GET /api/v1/providers/dashboard` | Stats, recent activity |
| Profile | `/profile` | `GET /api/v1/providers/profile` | Profile tabs, edit forms |
| Portfolio | `/profile/portfolio` | `GET /api/v1/providers/portfolio` | Image grid, upload |
| Packages | `/profile/packages` | `GET /api/v1/providers/packages` | Pricing cards, CRUD |
| Bookings | `/bookings` | `GET /api/v1/providers/bookings` | List with status filters |
| Booking Detail | `/bookings/:id` | `GET /api/v1/providers/bookings/:id` | Detail, status actions |
| Reviews | `/reviews` | `GET /api/v1/providers/reviews` | Review list, stats |
| Team | `/team` | `GET /api/v1/providers/team` | Team member list |
| Messages | `/messages` | `GET /api/v1/messages/conversations` | Conversation list, chat |
| Calendar | `/calendar` | `GET /api/v1/providers/availability` | Availability calendar |
| Analytics | `/analytics` | `GET /api/v1/providers/analytics` | Charts, metrics |

#### Web Client App (`apps/web/`) Pages to Audit:

| Page | Route | API Endpoint | Check |
|------|-------|--------------|-------|
| Landing Page | `/` | May have some static content (OK for landing) | Hero, features |
| Search | `/search` | `GET /api/v1/search` | Search results, filters |
| Vendor Profile | `/vendor/:slug` | `GET /api/v1/providers/:slug` | All sections |
| Categories | `/categories` | `GET /api/v1/categories` | Category grid |
| Login | `/login` | `POST /api/v1/auth/client/login` | Form submission |
| Register | `/register` | `POST /api/v1/auth/client/register` | Form submission |
| Dashboard | `/dashboard` | `GET /api/v1/wedding/stats` | Wedding stats |
| Guest List | `/dashboard/guests` | `GET /api/v1/wedding/guests` | CRUD |
| Budget | `/dashboard/budget` | `GET /api/v1/wedding/budget` | Budget tracking |
| Checklist | `/dashboard/checklist` | `GET /api/v1/wedding/checklist` | Task list |
| Bookings | `/dashboard/bookings` | `GET /api/v1/bookings` | Booking list |

#### Mobile App (`apps/mobile/`) Screens to Audit:

| Screen | Route | API Endpoint | Check |
|--------|-------|--------------|-------|
| Login | `/(auth)/login` | `POST /api/v1/auth/client/login` | Form submission |
| Register | `/(auth)/register` | `POST /api/v1/auth/client/register` | Form submission |
| Home | `/(main)/` | Multiple endpoints | Categories, featured, stats |
| Search | `/(main)/search` | `GET /api/v1/search` | Results, filters |
| Vendor Profile | `/(main)/vendor/[id]` | `GET /api/v1/providers/:id` | All sections |
| Bookings | `/(main)/bookings` | `GET /api/v1/bookings` | List with status |
| Booking Detail | `/(main)/booking/[id]` | `GET /api/v1/bookings/:id` | Detail, actions |
| Planner - Checklist | `/(main)/planner` | `GET /api/v1/wedding/checklist` | Task CRUD |
| Planner - Guests | `/(main)/planner` | `GET /api/v1/wedding/guests` | Guest CRUD |
| Planner - Budget | `/(main)/planner` | `GET /api/v1/wedding/budget` | Budget tracking |
| Chat | `/(main)/chat/[id]` | `GET /api/v1/messages/...` | Messages |
| Profile | `/(main)/profile` | `GET /api/v1/auth/me` | User info |

### 48.2 Fix Hardcoded Data

For any page found using hardcoded data, replace with TanStack Query hooks:

```typescript
// WRONG: Hardcoded data
const stats = [
  { label: 'Total Users', value: 1234 },
  { label: 'Active Tenants', value: 56 },
];

// RIGHT: Real API data
const { data: stats, isLoading, error } = useQuery({
  queryKey: ['admin', 'dashboard', 'stats'],
  queryFn: async () => {
    const response = await api.get('/admin/dashboard/stats');
    return response.data;
  },
});
```

Ensure every data-displaying component follows this pattern:

```typescript
function DataList() {
  const { t } = useTranslation();
  const { data, isLoading, error, refetch } = useMyData();

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <ErrorState
        message={t('common.error')}
        onRetry={refetch}
      />
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon="inbox-outline"
        title={t('mySection.noData')}
        subtitle={t('mySection.noDataHint')}
      />
    );
  }

  return <FlatList data={data} ... />;
}
```

### 48.3 Verify Auth Flows End-to-End

Test each auth flow against the real backend:

**Admin User Flow:**
1. Navigate to admin app (`admin.{domain}` or `localhost:3002`)
2. Login with admin credentials → `POST /api/v1/auth/admin/login`
3. Verify dashboard loads with real data
4. Navigate through all admin pages — each should show real data or proper empty state
5. Verify token refresh works (wait 15+ minutes or manually expire token)
6. Verify logout clears session

**Provider/Tenant User Flow:**
1. Navigate to provider portal (`{slug}.{domain}` or `localhost:3001`)
2. Verify tenant slug extracted from subdomain or entered manually
3. Login with tenant credentials → `POST /api/v1/auth/tenant/login` with `tenantSlug`
4. Verify dashboard loads with tenant-scoped data
5. Verify all provider pages show tenant-scoped data (not other tenants')
6. Verify profile edit updates via API

**Client User Flow:**
1. Navigate to web app (`app.{domain}` or `localhost:3000`)
2. Register new account → `POST /api/v1/auth/client/register`
3. Verify email received (check Mailpit in dev)
4. Login → `POST /api/v1/auth/client/login`
5. Search for vendors → results from Meilisearch
6. View vendor profile → all sections load
7. Submit inquiry → creates booking
8. Access wedding dashboard → create wedding if needed
9. Use planning tools (checklist, guests, budget)
10. Mobile: repeat steps 2-9 on mobile app

### 48.4 Verify Multi-Tenancy Isolation

- Provider portal sends `X-Tenant-ID` or `X-Tenant-Slug` header on ALL API requests
- Verify in browser DevTools Network tab that every request includes the tenant header
- Log in as two different tenants and verify each only sees their own data
- Verify that accessing another tenant's resources returns 403 or 404

### 48.5 Verify Error Handling

Test each HTTP error code and verify the frontend handles it correctly:

| Status | Scenario | Expected Frontend Behavior |
|--------|----------|---------------------------|
| 401 | Token expired | Token refresh → retry. If refresh fails → redirect to login |
| 403 | No permission | Show "Permission denied" message (localized) |
| 404 | Resource not found | Show "Not found" state (localized) |
| 422 | Validation error | Show field-level errors from API response |
| 429 | Rate limited | Show "Too many requests" message (localized) |
| 500 | Server error | Show generic "Something went wrong" with retry (localized) |
| Network error | No connection | Show "Check your connection" (localized) |

For each app, verify:
- 401 handling: Axios interceptor attempts token refresh, retries original request, or redirects to login
- 422 handling: Form components display validation errors from API `error.details` field
- Generic errors: Error boundary or error state component shows localized message

### 48.6 Verify Query Parameter Format

Ensure all frontend API calls use the backend's bracket notation for filters:

```typescript
// WRONG
api.get('/providers?status=active&rating_gte=4')

// RIGHT
api.get('/providers?filter[status]=active&filter[rating][gte]=4.0&sort=-rating&page=1&pageSize=20')
```

Check all TanStack Query hooks across all apps for correct query parameter format.

### 48.7 Build Verification

Run builds for all apps and fix any TypeScript errors:

```bash
# Backend
cd backend && npm run build     # Must pass with 0 errors

# Admin
cd apps/admin && npm run build  # Must pass with 0 errors

# Provider Portal
cd apps/provider-portal && npm run build  # Must pass with 0 errors

# Web
cd apps/web && npm run build    # Must pass with 0 errors

# Mobile
cd apps/mobile && npm run typecheck  # Must pass with 0 errors
```

Fix any errors found. Common issues to fix:
- Missing type imports
- `any` types that should be properly typed
- Unused imports
- Missing translation keys
- Props type mismatches

### 48.8 Integration Checklist

Create `docs/integration-checklist.md`:

A comprehensive checklist for manual verification:

```markdown
# Integration Verification Checklist

## Admin App
- [ ] Login → dashboard shows real stats
- [ ] Tenants page: list loads, create/edit/delete works
- [ ] Users page: list loads, CRUD works
- [ ] Roles page: list loads, permissions grid works
- [ ] Subscriptions: plans load, CRUD works
- [ ] Audit logs: data table loads with filters
- [ ] Jobs: Bull Board loads
- [ ] Settings: forms load and save
- [ ] Logout: clears session, redirects to login

## Provider Portal
- [ ] Tenant slug extracted from subdomain
- [ ] Login with tenant credentials
- [ ] Dashboard: stats load
- [ ] Profile: all tabs load and save
- [ ] Portfolio: images load, upload works
- [ ] Packages: list loads, CRUD works
- [ ] Bookings: list loads, status actions work
- [ ] Reviews: list loads
- [ ] Team: list loads, invite works
- [ ] Messages: conversations load, send works
- [ ] Analytics: charts render with real data

## Web Client App
- [ ] Landing page renders
- [ ] Register creates account
- [ ] Login authenticates
- [ ] Search returns real vendors from Meilisearch
- [ ] Vendor profile loads all sections
- [ ] Inquiry form submits
- [ ] Wedding dashboard loads stats
- [ ] Checklist CRUD works
- [ ] Guest list CRUD works
- [ ] Budget tracking works
- [ ] Bookings list loads

## Mobile App
- [ ] Login authenticates against real API
- [ ] Register creates account
- [ ] Auto-login on restart (SecureStore)
- [ ] Home: categories and featured vendors load
- [ ] Search: results from Meilisearch
- [ ] Vendor profile: all sections load
- [ ] Inquiry: submits to API
- [ ] Bookings: list loads, actions work
- [ ] Checklist: CRUD works
- [ ] Guest list: CRUD works
- [ ] Budget: tracking works
- [ ] Messages: send/receive works
- [ ] Profile: shows user info, language toggle works
- [ ] Offline banner appears when disconnected

## Cross-Cutting
- [ ] Token refresh works (15m expiry → auto-refresh)
- [ ] 401 → redirect to login (after refresh fails)
- [ ] 403 → permission denied message
- [ ] 404 → not found state
- [ ] 422 → validation errors on form fields
- [ ] 429 → rate limit message
- [ ] 500 → generic error with retry
- [ ] All text localized (en + am)
- [ ] All colors from theme (no hardcoded hex)
- [ ] No hardcoded demo data arrays
- [ ] Multi-tenant isolation verified
```

## Acceptance Criteria
- [ ] Every page in admin app fetches data from real API (no hardcoded arrays)
- [ ] Every page in provider portal fetches data from real API
- [ ] Every page in web client fetches data from real API
- [ ] Every screen in mobile app fetches data from real API
- [ ] All pages show loading state (skeleton/spinner) while fetching
- [ ] All pages show empty state when API returns empty
- [ ] All pages show error state when API fails
- [ ] All forms submit to real API endpoints
- [ ] Admin login → dashboard → all pages work with real data
- [ ] Provider login with tenant slug → scoped data visible
- [ ] Client register → login → wedding dashboard → search → booking works
- [ ] Token refresh works automatically on 401
- [ ] Multi-tenancy: provider portal sends tenant header on all requests
- [ ] Multi-tenancy: data isolated between tenants
- [ ] Error states display correctly for 401, 403, 404, 422, 429, 500
- [ ] Query parameters use bracket notation throughout
- [ ] `npm run build` passes with 0 errors in backend
- [ ] `npm run build` passes with 0 errors in admin app
- [ ] `npm run build` passes with 0 errors in provider-portal
- [ ] `npm run build` passes with 0 errors in web app
- [ ] `npm run typecheck` passes with 0 errors in mobile app
- [ ] Integration checklist document created at `docs/integration-checklist.md`
- [ ] No demo/mock data in any production code path

## Files to Create/Modify
- `docs/integration-checklist.md` (create)
- Various files across all 4 apps where hardcoded data is found (fix)
- Various hook files to fix query parameter format if needed
- Various components to add missing loading/empty/error states
- TypeScript fixes across all apps as needed

## Dependencies
- Tasks 01-27 (backend complete)
- Tasks 28-40 (web frontend apps complete)
- Tasks 41-46 (mobile app complete)
- Task 47: Production Deployment (for subdomain testing)

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
   - Set tasks.48-api-integration.status to "completed"
   - Set each subtask to "completed" as you finish them
   - Set tasks.48-api-integration.completed_at to current ISO timestamp
   - Add any important notes to tasks.48-api-integration.notes
6. Finally, create a git commit with message: "feat: implement 48-api-integration — API Integration Verification — No Demo Data, Real Endpoints"

DO NOT skip any part of the task. Implement everything listed in the spec.
If you encounter a blocker, update progress.json notes field with the issue and set status to "failed".
