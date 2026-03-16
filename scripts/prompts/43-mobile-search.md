You are implementing task "Mobile Public Screens — Vendor Search, Vendor Profile, Categories" for the Directory SaaS boilerplate project.

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
  - home-screen: pending
  - search-screen: pending
  - vendor-profile: pending
  - categories: pending
  - inquiry-form: pending



## TASK SPECIFICATION

# Task 43: Mobile Public Screens — Vendor Search, Vendor Profile, Categories

## Summary
Build the vendor discovery experience: home dashboard with categories and featured vendors, full-text search with filters and infinite scroll, detailed vendor profile with portfolio/packages/reviews, inquiry form, and category browsing. All data from real API endpoints via Meilisearch and backend REST endpoints.

## Current State
- Task 41 scaffolded the app with NativeWind, i18n, API client, auth store
- Task 42 implemented auth screens and 5-tab navigation (Home, Search, Bookings, Planner, Profile)
- Home and Search tabs have placeholder content
- Backend has: `GET /api/v1/search` (Meilisearch), vendor/provider endpoints, review endpoints, category endpoints
- Backend query parameters use bracket notation: `filter[status]=active&filter[category]=photography&sort=-rating&page=1&pageSize=20`

## Required Changes

### 43.1 API Hooks

Create `hooks/api/` directory with TanStack Query hooks:

**hooks/api/use-search.ts:**

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface SearchParams {
  query?: string;
  category?: string;
  priceMin?: number;
  priceMax?: number;
  ratingMin?: number;
  sort?: string;
}

interface Vendor {
  id: string;
  businessName: string;
  slug: string;
  category: string;
  description: string;
  location: string;
  rating: number;
  reviewCount: number;
  startingPrice: number | null;
  coverImage: string | null;
  isVerified: boolean;
}

interface PaginatedResponse {
  data: Vendor[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

export function useSearchVendors(params: SearchParams) {
  return useInfiniteQuery({
    queryKey: ['vendors', 'search', params],
    queryFn: async ({ pageParam = 1 }) => {
      const searchParams = new URLSearchParams();
      if (params.query) searchParams.set('q', params.query);
      if (params.category) searchParams.set('filter[category]', params.category);
      if (params.priceMin) searchParams.set('filter[startingPrice][gte]', String(params.priceMin));
      if (params.priceMax) searchParams.set('filter[startingPrice][lte]', String(params.priceMax));
      if (params.ratingMin) searchParams.set('filter[rating][gte]', String(params.ratingMin));
      if (params.sort) searchParams.set('sort', params.sort);
      searchParams.set('page', String(pageParam));
      searchParams.set('pageSize', '20');

      const response = await api.get(`/search?${searchParams.toString()}`);
      return response.data as PaginatedResponse;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });
}
```

**hooks/api/use-vendors.ts:**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useVendor(id: string) {
  return useQuery({
    queryKey: ['vendor', id],
    queryFn: async () => {
      const response = await api.get(`/providers/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useVendorPortfolio(vendorId: string) {
  return useQuery({
    queryKey: ['vendor', vendorId, 'portfolio'],
    queryFn: async () => {
      const response = await api.get(`/providers/${vendorId}/portfolio`);
      return response.data;
    },
    enabled: !!vendorId,
  });
}

export function useVendorPackages(vendorId: string) {
  return useQuery({
    queryKey: ['vendor', vendorId, 'packages'],
    queryFn: async () => {
      const response = await api.get(`/providers/${vendorId}/packages`);
      return response.data;
    },
    enabled: !!vendorId,
  });
}

export function useVendorReviews(vendorId: string) {
  return useQuery({
    queryKey: ['vendor', vendorId, 'reviews'],
    queryFn: async () => {
      const response = await api.get(`/providers/${vendorId}/reviews`);
      return response.data;
    },
    enabled: !!vendorId,
  });
}

export function useFeaturedVendors() {
  return useQuery({
    queryKey: ['vendors', 'featured'],
    queryFn: async () => {
      const response = await api.get('/providers?filter[isFeatured]=true&pageSize=10');
      return response.data;
    },
  });
}

export function useSendInquiry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      vendorId: string;
      weddingDate?: string;
      guestCount?: number;
      message: string;
      budgetRange?: string;
    }) => {
      const response = await api.post('/bookings/inquiries', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}
```

**hooks/api/use-categories.ts:**

```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories');
      return response.data;
    },
    staleTime: 1000 * 60 * 30, // Categories rarely change
  });
}
```

### 43.2 Reusable Components

**components/vendor-card.tsx:**

Vendor card component showing:
- Cover image (with placeholder if null)
- Business name
- Category badge
- Location with icon
- Star rating + review count
- Starting price
- Verified badge if applicable
- Pressable → navigates to vendor profile
- All text via `t()`, all colors from theme

```typescript
import { View, Text, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';

interface VendorCardProps {
  vendor: {
    id: string;
    businessName: string;
    category: string;
    location: string;
    rating: number;
    reviewCount: number;
    startingPrice: number | null;
    coverImage: string | null;
    isVerified: boolean;
  };
}

export function VendorCard({ vendor }: VendorCardProps) {
  const { t } = useTranslation();

  return (
    <Pressable
      className="mb-3 overflow-hidden rounded-card border border-border bg-surface"
      onPress={() => router.push(`/(main)/vendor/${vendor.id}`)}
    >
      {/* Cover image */}
      <View className="h-40 bg-surface-tertiary">
        {vendor.coverImage ? (
          <Image source={{ uri: vendor.coverImage }} className="h-full w-full" resizeMode="cover" />
        ) : (
          <View className="h-full w-full items-center justify-center">
            <Ionicons name="business-outline" size={40} color="#868e96" />
          </View>
        )}
        {vendor.isVerified && (
          <View className="absolute top-2 right-2 rounded-full bg-brand-600 px-2 py-0.5">
            <Ionicons name="checkmark-circle" size={14} color="#fff" />
          </View>
        )}
      </View>
      {/* Info */}
      <View className="p-3">
        <Text className="text-base font-semibold text-content">{vendor.businessName}</Text>
        <Text className="mt-0.5 text-sm text-content-secondary">{vendor.category}</Text>
        <View className="mt-1 flex-row items-center">
          <Ionicons name="location-outline" size={14} color="#868e96" />
          <Text className="ml-1 text-sm text-content-tertiary">{vendor.location}</Text>
        </View>
        <View className="mt-2 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Ionicons name="star" size={14} color="#fab005" />
            <Text className="ml-1 text-sm font-medium text-content">{vendor.rating.toFixed(1)}</Text>
            <Text className="ml-1 text-sm text-content-tertiary">
              ({t('vendor.reviewCount', { count: vendor.reviewCount })})
            </Text>
          </View>
          {vendor.startingPrice && (
            <Text className="text-sm font-semibold text-brand-600">
              {t('vendor.startingFrom')} ${vendor.startingPrice}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}
```

**components/skeleton.tsx:**

Loading skeleton component with shimmer animation:

```typescript
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  className?: string;
}

export function Skeleton({ width, height = 20, borderRadius = 8, className }: SkeletonProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.7, { duration: 800 }), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      className={`bg-surface-tertiary ${className || ''}`}
      style={[{ width, height, borderRadius }, animatedStyle]}
    />
  );
}

export function VendorCardSkeleton() {
  return (
    <View className="mb-3 overflow-hidden rounded-card border border-border bg-surface">
      <Skeleton height={160} borderRadius={0} />
      <View className="p-3">
        <Skeleton width="70%" height={18} />
        <Skeleton width="40%" height={14} className="mt-2" />
        <Skeleton width="50%" height={14} className="mt-1" />
        <View className="mt-2 flex-row justify-between">
          <Skeleton width="30%" height={14} />
          <Skeleton width="25%" height={14} />
        </View>
      </View>
    </View>
  );
}
```

**components/empty-state.tsx:**

```typescript
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  actionTitle?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, subtitle, actionTitle, onAction }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <Ionicons name={icon} size={64} color="#868e96" />
      <Text className="mt-4 text-center text-lg font-semibold text-content">{title}</Text>
      {subtitle && (
        <Text className="mt-2 text-center text-sm text-content-secondary">{subtitle}</Text>
      )}
      {actionTitle && onAction && (
        <View className="mt-6">
          <Button title={actionTitle} onPress={onAction} />
        </View>
      )}
    </View>
  );
}
```

**components/filter-bottom-sheet.tsx:**

Bottom sheet for search filters using a Modal or custom animated view:
- Category selection (from API)
- Price range slider (min/max)
- Minimum rating selection (1-5 stars)
- Sort options (relevance, price low/high, highest rated)
- "Apply Filters" and "Clear Filters" buttons
- Animated slide-up with Reanimated
- All text via `t()`, all colors from theme

### 43.3 Home/Dashboard Screen

**app/(main)/index.tsx:**

Complete home screen with:
- SafeAreaView with padding
- Welcome message: `t('home.welcome', { name: user.name })`
- Search bar (Pressable that navigates to search tab)
- **Categories** horizontal scroll:
  - Grid of category icons (from `useCategories()` hook)
  - Each icon is a Pressable → navigates to search with category pre-selected
  - Show loading skeletons while fetching
- **Featured Vendors** horizontal carousel:
  - `FlatList` with `horizontal` and `showsHorizontalScrollIndicator={false}`
  - Uses `useFeaturedVendors()` hook
  - Each item is a compact `VendorCard`
  - "See All" button → navigate to search
- **Wedding Stats** (if user has a wedding):
  - Countdown card (days until wedding)
  - Quick stats row: vendors booked, tasks done, guests confirmed
  - Data from wedding API endpoint
- **Recently Viewed** (optional, from local storage or API)
- Pull-to-refresh on the ScrollView
- Loading skeletons for each section

```typescript
// Pattern:
import { ScrollView, RefreshControl, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { data: categories, isLoading: categoriesLoading, refetch: refetchCategories } = useCategories();
const { data: featured, isLoading: featuredLoading, refetch: refetchFeatured } = useFeaturedVendors();

const [refreshing, setRefreshing] = useState(false);
const onRefresh = async () => {
  setRefreshing(true);
  await Promise.all([refetchCategories(), refetchFeatured()]);
  setRefreshing(false);
};
```

### 43.4 Vendor Search Screen

**app/(main)/search.tsx:**

Full search screen with:
- Search input with debounce (300ms) using a custom `useDebounce` hook
- Filter chips row (active filters shown as removable chips)
- "Filters" button → opens filter bottom sheet
- Results list using `FlatList` with `useSearchVendors()` infinite query
- `onEndReached` → `fetchNextPage()` for infinite scroll
- Loading: show `VendorCardSkeleton` array
- Empty state: "No vendors found" with "Try adjusting your filters"
- Error state with retry button
- Pull-to-refresh

```typescript
// hooks/use-debounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
```

```typescript
// In search screen:
const [query, setQuery] = useState('');
const [filters, setFilters] = useState<SearchFilters>({});
const debouncedQuery = useDebounce(query, 300);

const {
  data,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  refetch,
} = useSearchVendors({ query: debouncedQuery, ...filters });

const vendors = data?.pages.flatMap((page) => page.data) ?? [];

<FlatList
  data={vendors}
  renderItem={({ item }) => <VendorCard vendor={item} />}
  keyExtractor={(item) => item.id}
  onEndReached={() => hasNextPage && fetchNextPage()}
  onEndReachedThreshold={0.5}
  ListEmptyComponent={!isLoading ? <EmptyState ... /> : null}
  ListFooterComponent={isFetchingNextPage ? <ActivityIndicator /> : null}
  refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
/>
```

### 43.5 Vendor Profile Screen

**app/(main)/vendor/[id].tsx:**

Stack-pushed screen from search results:
- **Hero section:** cover image or image carousel (horizontal FlatList with pagination dots)
- **Header:** business name, category badge, location, verified badge
- **Stats row:** rating (stars), review count, starting price
- **Action buttons row:** "Request Quote" (primary), "Save" (outline), "Share" (outline)
- **Tab sections** (segmented control or scrollable top tabs):
  - **About:** description text, contact info, operating hours
  - **Portfolio:** image grid (2 columns), tap to view fullscreen (Modal with Image)
  - **Packages:** pricing cards with name, description, price, included items
  - **Reviews:** star breakdown bar chart, review list (avatar, name, rating, date, text)
  - **FAQ:** accordion/collapsible sections
- **Floating "Request Quote" button** at bottom
- **Inquiry bottom sheet** (triggered by "Request Quote"):
  - Wedding date picker
  - Guest count input
  - Message textarea
  - Budget range selector
  - Submit button → `useSendInquiry()` mutation
  - Success feedback with haptics

Data fetched using: `useVendor(id)`, `useVendorPortfolio(id)`, `useVendorPackages(id)`, `useVendorReviews(id)`

All with loading skeletons, error states, and empty states per section.

### 43.6 Categories View

If categories are shown on home as a grid, also support a "See All Categories" screen or section:

- Grid layout (2 or 3 columns)
- Each category: icon, name, vendor count
- Tap → navigate to search with `category` filter pre-set
- Data from `useCategories()` hook

Category icons: map category names to Ionicons (e.g., "Photography" → "camera-outline", "Catering" → "restaurant-outline", "Music" → "musical-notes-outline"). Create a `lib/category-icons.ts` mapping.

```typescript
// lib/category-icons.ts
import { type ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

type IconName = ComponentProps<typeof Ionicons>['name'];

export const categoryIcons: Record<string, IconName> = {
  photography: 'camera-outline',
  catering: 'restaurant-outline',
  music: 'musical-notes-outline',
  venue: 'business-outline',
  decoration: 'flower-outline',
  cake: 'cafe-outline',
  makeup: 'color-palette-outline',
  transportation: 'car-outline',
  invitation: 'mail-outline',
  planning: 'clipboard-outline',
};

export function getCategoryIcon(category: string): IconName {
  return categoryIcons[category.toLowerCase()] || 'grid-outline';
}
```

## Acceptance Criteria
- [ ] Home screen shows welcome message with user name (localized)
- [ ] Categories load from real API and display as horizontal scroll
- [ ] Featured vendors load from real API and display as horizontal carousel
- [ ] Tapping category navigates to search with category pre-filtered
- [ ] Search input debounces (300ms) and queries Meilisearch via API
- [ ] Filter bottom sheet opens with category, price, rating, sort options
- [ ] Active filters shown as removable chips
- [ ] Infinite scroll loads more vendors on scroll to bottom
- [ ] Loading state shows skeleton cards
- [ ] Empty state shows "No vendors found" message
- [ ] Vendor card shows image, name, category, location, rating, price
- [ ] Tapping vendor card opens vendor profile screen
- [ ] Vendor profile shows hero image, info, tabs (About, Portfolio, Packages, Reviews, FAQ)
- [ ] Portfolio shows image grid, tap for fullscreen view
- [ ] Packages show pricing cards
- [ ] Reviews show star breakdown and review list
- [ ] "Request Quote" opens inquiry bottom sheet
- [ ] Inquiry form submits to real API endpoint
- [ ] Success feedback with haptic notification
- [ ] Pull-to-refresh works on home and search screens
- [ ] All text via `t()` — no hardcoded strings
- [ ] All colors from NativeWind theme — no hardcoded colors
- [ ] TypeScript compiles with 0 errors

## Files to Create/Modify
- `apps/mobile/hooks/api/use-search.ts` (create)
- `apps/mobile/hooks/api/use-vendors.ts` (create)
- `apps/mobile/hooks/api/use-categories.ts` (create)
- `apps/mobile/hooks/use-debounce.ts` (create)
- `apps/mobile/lib/category-icons.ts` (create)
- `apps/mobile/components/vendor-card.tsx` (create)
- `apps/mobile/components/skeleton.tsx` (create)
- `apps/mobile/components/empty-state.tsx` (create)
- `apps/mobile/components/filter-bottom-sheet.tsx` (create)
- `apps/mobile/components/inquiry-bottom-sheet.tsx` (create)
- `apps/mobile/app/(main)/index.tsx` (rewrite)
- `apps/mobile/app/(main)/search.tsx` (rewrite)
- `apps/mobile/app/(main)/vendor/[id].tsx` (create)
- `apps/mobile/i18n/en.json` (update if needed)
- `apps/mobile/i18n/am.json` (update if needed)

## Dependencies
- Task 41: Mobile App Scaffolding
- Task 42: Mobile Auth

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
   - Set tasks.43-mobile-search.status to "completed"
   - Set each subtask to "completed" as you finish them
   - Set tasks.43-mobile-search.completed_at to current ISO timestamp
   - Add any important notes to tasks.43-mobile-search.notes
6. Finally, create a git commit with message: "feat: implement 43-mobile-search — Mobile Public Screens — Vendor Search, Vendor Profile, Categories"

DO NOT skip any part of the task. Implement everything listed in the spec.
If you encounter a blocker, update progress.json notes field with the issue and set status to "failed".
