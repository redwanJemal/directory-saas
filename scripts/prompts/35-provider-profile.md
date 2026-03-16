You are implementing task "Provider Portal — Profile & Portfolio Management" for the Directory SaaS boilerplate project.

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
  - profile-page: pending
  - packages-tab: pending
  - faqs-tab: pending
  - availability-tab: pending
  - portfolio-page: pending



## TASK SPECIFICATION

# Task 35: Provider Portal — Profile & Portfolio Management

## Summary
Build the profile editing page (tabbed layout with general info, packages, FAQs, availability) and the portfolio management page (upload, reorder, manage media items). These are core provider features for managing their directory listing.

## Current State
- Provider portal has layout with sidebar, header, routing (Task 34)
- ProfilePage and PortfolioPage are placeholders
- Backend endpoints available:
  - Profile: `GET /api/v1/providers/me`, `PATCH /api/v1/providers/me`
  - Packages: `GET /api/v1/providers/me/packages`, `POST/PATCH/DELETE /api/v1/providers/me/packages/:id`
  - FAQs: `GET /api/v1/providers/me/faqs`, `POST/PATCH/DELETE /api/v1/providers/me/faqs/:id`
  - Availability: `GET /api/v1/providers/me/availability`, `PATCH /api/v1/providers/me/availability`
  - Portfolio: `GET /api/v1/providers/me/portfolio`, `POST/PATCH/DELETE /api/v1/providers/me/portfolio/:id`
  - Uploads: `POST /api/v1/uploads/presigned-url`, `POST /api/v1/uploads/confirm`
- Tenant context is propagated via X-Tenant-ID header from Task 34

## Required Changes

### 35.1 Install Dependencies

```bash
cd apps/provider-portal && npm install date-fns @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

- `date-fns` — date formatting and calendar utilities
- `@dnd-kit/*` — drag and drop for reordering packages, FAQs, portfolio items

### 35.2 Profile Types

Create `apps/provider-portal/src/features/profile/types.ts`:

```typescript
export interface ProviderProfile {
  id: string;
  businessName: string;
  description: string;
  category: string;
  location: string;
  city: string;
  state: string;
  styles: string[];
  languages: string[];
  phone: string;
  email: string;
  website: string;
  logoUrl: string | null;
  coverPhotoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  priceType: 'fixed' | 'starting_from' | 'hourly' | 'custom';
  duration: string;
  inclusions: string[];
  sortOrder: number;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
}

export interface AvailabilityDate {
  date: string; // ISO date string
  status: 'available' | 'booked' | 'blocked';
}

export interface PortfolioItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl: string | null;
  title: string;
  description: string;
  eventDate: string | null;
  venue: string | null;
  isCover: boolean;
  sortOrder: number;
}
```

### 35.3 Profile Schemas

Create `apps/provider-portal/src/features/profile/schemas.ts`:

```typescript
import { z } from 'zod';

export const profileSchema = z.object({
  businessName: z.string().min(2, 'Business name is required').max(100),
  description: z.string().max(2000).optional(),
  category: z.string().min(1, 'Category is required'),
  location: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  styles: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
});

export const packageSchema = z.object({
  name: z.string().min(1, 'Package name is required').max(100),
  description: z.string().max(1000).optional(),
  price: z.number().min(0, 'Price must be positive'),
  priceType: z.enum(['fixed', 'starting_from', 'hourly', 'custom']),
  duration: z.string().max(100).optional(),
  inclusions: z.array(z.string()),
});

export const faqSchema = z.object({
  question: z.string().min(1, 'Question is required').max(500),
  answer: z.string().min(1, 'Answer is required').max(2000),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
export type PackageFormData = z.infer<typeof packageSchema>;
export type FAQFormData = z.infer<typeof faqSchema>;
```

### 35.4 TanStack Query Hooks

Create `apps/provider-portal/src/features/profile/hooks/use-profile.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ProviderProfile, Package, FAQ, AvailabilityDate, PortfolioItem } from '../types';

// Profile
export function useProfileQuery() {
  return useQuery({
    queryKey: ['provider-profile'],
    queryFn: async () => {
      const response = await api.get<{ data: ProviderProfile }>('/providers/me');
      return response.data.data;
    },
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<ProviderProfile>) => {
      const response = await api.patch<{ data: ProviderProfile }>('/providers/me', data);
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['provider-profile'] }),
  });
}

// Packages
export function usePackagesQuery() {
  return useQuery({
    queryKey: ['provider-packages'],
    queryFn: async () => {
      const response = await api.get<{ data: Package[] }>('/providers/me/packages');
      return response.data.data;
    },
  });
}

export function useCreatePackageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Package, 'id' | 'sortOrder'>) => {
      const response = await api.post<{ data: Package }>('/providers/me/packages', data);
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['provider-packages'] }),
  });
}

export function useUpdatePackageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Package> & { id: string }) => {
      const response = await api.patch<{ data: Package }>(`/providers/me/packages/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['provider-packages'] }),
  });
}

export function useDeletePackageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/providers/me/packages/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['provider-packages'] }),
  });
}

export function useReorderPackagesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      await api.patch('/providers/me/packages/reorder', { ids: orderedIds });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['provider-packages'] }),
  });
}

// FAQs — same CRUD pattern as packages
export function useFAQsQuery() { /* ... */ }
export function useCreateFAQMutation() { /* ... */ }
export function useUpdateFAQMutation() { /* ... */ }
export function useDeleteFAQMutation() { /* ... */ }
export function useReorderFAQsMutation() { /* ... */ }

// Availability
export function useAvailabilityQuery(month: string) {
  return useQuery({
    queryKey: ['provider-availability', month],
    queryFn: async () => {
      const response = await api.get<{ data: AvailabilityDate[] }>(`/providers/me/availability?month=${month}`);
      return response.data.data;
    },
  });
}

export function useUpdateAvailabilityMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dates: Array<{ date: string; status: string }>) => {
      await api.patch('/providers/me/availability', { dates });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['provider-availability'] }),
  });
}

// Portfolio
export function usePortfolioQuery() { /* ... */ }
export function useCreatePortfolioItemMutation() { /* ... */ }
export function useUpdatePortfolioItemMutation() { /* ... */ }
export function useDeletePortfolioItemMutation() { /* ... */ }
export function useReorderPortfolioMutation() { /* ... */ }
```

### 35.5 Profile Page — Tabbed Layout

Replace `apps/provider-portal/src/features/profile/profile-page.tsx`:

```typescript
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GeneralInfoTab } from './components/general-info-tab';
import { PackagesTab } from './components/packages-tab';
import { FAQsTab } from './components/faqs-tab';
import { AvailabilityTab } from './components/availability-tab';

export function ProfilePage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{t('profile.title')}</h1>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">{t('profile.generalInfo')}</TabsTrigger>
          <TabsTrigger value="packages">{t('profile.packages')}</TabsTrigger>
          <TabsTrigger value="faqs">{t('profile.faqs')}</TabsTrigger>
          <TabsTrigger value="availability">{t('profile.availability')}</TabsTrigger>
        </TabsList>

        <TabsContent value="general"><GeneralInfoTab /></TabsContent>
        <TabsContent value="packages"><PackagesTab /></TabsContent>
        <TabsContent value="faqs"><FAQsTab /></TabsContent>
        <TabsContent value="availability"><AvailabilityTab /></TabsContent>
      </Tabs>
    </div>
  );
}
```

### 35.6 General Info Tab

Create `apps/provider-portal/src/features/profile/components/general-info-tab.tsx`:

- Card with form fields: business name, description (textarea), category (select), location, city, state, styles (multi-select/tags), languages (multi-select/tags), phone, email, website
- Logo upload area (click to upload, shows current logo)
- Cover photo upload area
- Save button at bottom
- Fetch current profile on mount with `useProfileQuery()`
- Submit calls `useUpdateProfileMutation()`
- Zod validation on submit
- Toast success/error

For image upload, create a reusable `ImageUpload` component:
```typescript
// components/image-upload.tsx
// 1. Get presigned URL: POST /api/v1/uploads/presigned-url { filename, contentType }
// 2. Upload file to presigned URL (PUT to MinIO/S3)
// 3. Confirm upload: POST /api/v1/uploads/confirm { key }
// 4. Returns the public URL
```

### 35.7 Packages Tab

Create `apps/provider-portal/src/features/profile/components/packages-tab.tsx`:

- List of package cards (sortable via @dnd-kit)
- Each card shows: name, price (formatted), price type, description, inclusions list
- "Add Package" button opens dialog
- Edit/Delete actions per card
- Drag handle for reordering
- Package form dialog fields: name, description, price (number input), price type (select: fixed/starting_from/hourly/custom), duration, inclusions (dynamic list — add/remove items)

**Inclusions list pattern** in the dialog:
```typescript
// Dynamic list of string inputs
const [inclusions, setInclusions] = useState<string[]>([]);

// Add item
<Button onClick={() => setInclusions([...inclusions, ''])}>Add Inclusion</Button>

// Each item has an input + remove button
{inclusions.map((item, index) => (
  <div key={index} className="flex gap-2">
    <Input value={item} onChange={(e) => updateInclusion(index, e.target.value)} />
    <Button variant="ghost" size="icon" onClick={() => removeInclusion(index)}>
      <X className="h-4 w-4" />
    </Button>
  </div>
))}
```

### 35.8 FAQs Tab

Create `apps/provider-portal/src/features/profile/components/faqs-tab.tsx`:

- List of FAQ items (sortable via @dnd-kit)
- Each item shows question as title, answer as collapsible content (Accordion)
- "Add FAQ" button opens dialog
- Edit/Delete actions per item
- FAQ form dialog: question (input), answer (textarea)
- Drag handle for reordering

### 35.9 Availability Tab

Create `apps/provider-portal/src/features/profile/components/availability-tab.tsx`:

- Month calendar view (custom calendar grid component)
- Navigation: prev/next month buttons with month/year display
- Each day cell shows colored indicator:
  - Available: green
  - Booked: blue (cannot change)
  - Blocked: red/gray
- Click on available date → toggle to blocked (and vice versa)
- Cannot click on booked dates
- "Block Date Range" button: opens dialog with start/end date inputs to bulk-block
- Save changes button (batches all changes and submits)

Calendar grid implementation:
```typescript
import { startOfMonth, endOfMonth, eachDayOfInterval, format, addMonths, subMonths, getDay, isSameMonth } from 'date-fns';

function CalendarGrid({ month, availability, onDateClick }: CalendarGridProps) {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const days = eachDayOfInterval({ start, end });
  const startDay = getDay(start); // 0=Sun

  return (
    <div className="grid grid-cols-7 gap-1">
      {/* Day headers */}
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
        <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">{day}</div>
      ))}
      {/* Empty cells for offset */}
      {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} />)}
      {/* Day cells */}
      {days.map((day) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const status = availability.find((a) => a.date === dateStr)?.status ?? 'available';
        return (
          <button
            key={dateStr}
            onClick={() => onDateClick(dateStr, status)}
            disabled={status === 'booked'}
            className={cn(
              'aspect-square rounded-md text-sm flex items-center justify-center',
              status === 'available' && 'bg-green-100 hover:bg-green-200 dark:bg-green-900/30',
              status === 'booked' && 'bg-blue-100 cursor-not-allowed dark:bg-blue-900/30',
              status === 'blocked' && 'bg-red-100 hover:bg-red-200 dark:bg-red-900/30',
            )}
          >
            {format(day, 'd')}
          </button>
        );
      })}
    </div>
  );
}
```

### 35.10 Portfolio Page

Replace `apps/provider-portal/src/features/portfolio/portfolio-page.tsx`:

- Grid of portfolio items (responsive: 1 col mobile, 2 col tablet, 3-4 col desktop)
- Each item: thumbnail image, title overlay, hover actions (edit, delete, set cover)
- Cover photo has a "Cover" badge
- "Upload" button opens file upload zone
- Upload zone: drag & drop area with click-to-browse, accepts images (jpg, png, webp) and videos (mp4), max file size 10MB
- Multi-file upload with progress indicators
- Edit item dialog: title, description, event date (date picker), venue
- Delete with confirmation
- Reorder via drag and drop (@dnd-kit grid)

**File upload flow**:
```typescript
async function uploadFile(file: File): Promise<string> {
  // 1. Get presigned URL
  const { data } = await api.post('/uploads/presigned-url', {
    filename: file.name,
    contentType: file.type,
  });
  const { uploadUrl, key } = data.data;

  // 2. Upload to presigned URL
  await axios.put(uploadUrl, file, {
    headers: { 'Content-Type': file.type },
    onUploadProgress: (progressEvent) => {
      const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total ?? 1));
      setProgress(prev => ({ ...prev, [file.name]: percent }));
    },
  });

  // 3. Confirm upload
  const confirmed = await api.post('/uploads/confirm', { key });
  return confirmed.data.data.url;
}
```

**Drag and drop upload zone component**:
```typescript
function DropZone({ onFilesSelected }: { onFilesSelected: (files: File[]) => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        onFilesSelected(Array.from(e.dataTransfer.files));
      }}
      onClick={() => inputRef.current?.click()}
      className={cn(
        'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
        isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
      )}
    >
      <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
      <p className="mt-2 text-sm text-muted-foreground">{t('portfolio.dragDrop')}</p>
      <input ref={inputRef} type="file" multiple accept="image/*,video/mp4" className="hidden"
        onChange={(e) => onFilesSelected(Array.from(e.target.files ?? []))} />
    </div>
  );
}
```

## Acceptance Criteria
- [ ] Profile page renders with 4 tabs: General Info, Packages, FAQs, Availability
- [ ] General Info tab: form loads current profile, validates with Zod, saves on submit, shows toast
- [ ] Logo and cover photo upload works via presigned URL flow
- [ ] Packages tab: list packages as cards, create/edit/delete with dialogs, drag-to-reorder
- [ ] Package form: name, description, price, price type, duration, dynamic inclusions list
- [ ] FAQs tab: list FAQs, create/edit/delete, drag-to-reorder
- [ ] Availability tab: month calendar view, toggle available/blocked by clicking, bulk block date range
- [ ] Portfolio page: grid of items, upload via drag & drop with progress, edit/delete items
- [ ] Portfolio: set cover photo, reorder items via drag and drop
- [ ] File uploads use presigned URL flow (presigned → upload → confirm)
- [ ] All mutations show toast success/error notifications
- [ ] All strings from i18n translation files
- [ ] Provider portal builds with 0 errors

## Files to Create/Modify
- `apps/provider-portal/src/features/profile/types.ts` (create)
- `apps/provider-portal/src/features/profile/schemas.ts` (create)
- `apps/provider-portal/src/features/profile/hooks/use-profile.ts` (create)
- `apps/provider-portal/src/features/profile/profile-page.tsx` (replace)
- `apps/provider-portal/src/features/profile/components/general-info-tab.tsx` (create)
- `apps/provider-portal/src/features/profile/components/packages-tab.tsx` (create)
- `apps/provider-portal/src/features/profile/components/faqs-tab.tsx` (create)
- `apps/provider-portal/src/features/profile/components/availability-tab.tsx` (create)
- `apps/provider-portal/src/features/portfolio/portfolio-page.tsx` (replace)
- `apps/provider-portal/src/features/portfolio/types.ts` (create — or reuse from profile/types)
- `apps/provider-portal/src/features/portfolio/hooks/use-portfolio.ts` (create)
- `apps/provider-portal/src/features/portfolio/components/drop-zone.tsx` (create)
- `apps/provider-portal/src/features/portfolio/components/portfolio-item-card.tsx` (create)
- `apps/provider-portal/src/features/portfolio/components/edit-item-dialog.tsx` (create)
- `apps/provider-portal/src/components/image-upload.tsx` (create — reusable)
- `apps/provider-portal/src/i18n/en.json` (modify — ensure profile/portfolio translations)

## Dependencies
- Task 28 (Frontend Shared Foundation) — shadcn/ui components (Tabs, Card, Dialog, Input, etc.)
- Task 29 (Frontend i18n) — translation strings
- Task 30 (Frontend Auth) — auth store, API client
- Task 34 (Provider Layout) — DashboardLayout, sidebar routing, tenant context

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
   - Set tasks.35-provider-profile.status to "completed"
   - Set each subtask to "completed" as you finish them
   - Set tasks.35-provider-profile.completed_at to current ISO timestamp
   - Add any important notes to tasks.35-provider-profile.notes
6. Finally, create a git commit with message: "feat: implement 35-provider-profile — Provider Portal — Profile & Portfolio Management"

DO NOT skip any part of the task. Implement everything listed in the spec.
If you encounter a blocker, update progress.json notes field with the issue and set status to "failed".
