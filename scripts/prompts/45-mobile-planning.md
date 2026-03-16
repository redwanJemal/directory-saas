You are implementing task "Mobile Planning Tools — Guest List, Budget, Checklist, Messages" for the Directory SaaS boilerplate project.

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
  - checklist: pending
  - guest-list: pending
  - budget-tracker: pending
  - messages: pending



## TASK SPECIFICATION

# Task 45: Mobile Planning Tools — Guest List, Budget, Checklist, Messages

## Summary
Build the wedding planning tools within the Planner tab: checklist with swipe-to-complete, guest list management with RSVP tracking, budget tracker with charts, and vendor messaging. All data from real API endpoints with full CRUD operations.

## Current State
- Tasks 41-44 provide scaffolding, auth, search, and wedding dashboard
- Planner tab exists with placeholder content
- Backend has checklist, guest, budget, and messaging endpoints
- Reanimated is installed for gesture-based interactions
- No chart library installed yet

## Required Changes

### 45.1 Install Chart Dependencies

Add to `apps/mobile/package.json`:

```json
{
  "dependencies": {
    "react-native-svg": "^15.11.2",
    "victory-native": "^41.12.1"
  }
}
```

### 45.2 Planner Tab with Sub-Navigation

Rewrite **app/(main)/planner.tsx** as a screen with top tabs (segmented control):

```typescript
import { useState } from 'react';
import { View, Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

type PlannerTab = 'checklist' | 'guests' | 'budget';

export default function PlannerScreen() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<PlannerTab>('checklist');

  const tabs: { key: PlannerTab; label: string }[] = [
    { key: 'checklist', label: t('planner.checklist') },
    { key: 'guests', label: t('planner.guests') },
    { key: 'budget', label: t('planner.budget') },
  ];

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <Text className="px-4 pt-4 text-2xl font-bold text-content">
        {t('planner.title')}
      </Text>

      {/* Segmented control */}
      <View className="mx-4 mt-4 flex-row rounded-button bg-surface-secondary p-1">
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            className={`flex-1 rounded-button py-2 ${
              activeTab === tab.key ? 'bg-brand-600' : ''
            }`}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              className={`text-center text-sm font-medium ${
                activeTab === tab.key ? 'text-content-inverse' : 'text-content-secondary'
              }`}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      {activeTab === 'checklist' && <ChecklistView />}
      {activeTab === 'guests' && <GuestListView />}
      {activeTab === 'budget' && <BudgetView />}
    </SafeAreaView>
  );
}
```

### 45.3 API Hooks

**hooks/api/use-checklist.ts:**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface ChecklistTask {
  id: string;
  title: string;
  dueDate: string | null;
  category: string;
  isCompleted: boolean;
  completedAt: string | null;
  sortOrder: number;
}

export function useChecklist(filter?: 'all' | 'overdue' | 'upcoming' | 'completed') {
  return useQuery({
    queryKey: ['checklist', filter],
    queryFn: async () => {
      const params = filter && filter !== 'all' ? `?filter[status]=${filter}` : '';
      const response = await api.get(`/wedding/checklist${params}`);
      return response.data as ChecklistTask[];
    },
  });
}

export function useToggleTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isCompleted }: { id: string; isCompleted: boolean }) => {
      const response = await api.patch(`/wedding/checklist/${id}`, { isCompleted });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist'] });
      queryClient.invalidateQueries({ queryKey: ['wedding', 'stats'] });
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { title: string; dueDate?: string; category?: string }) => {
      const response = await api.post('/wedding/checklist', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist'] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/wedding/checklist/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist'] });
    },
  });
}
```

**hooks/api/use-guests.ts:**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface Guest {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  side: 'bride' | 'groom' | 'both';
  relationship: string;
  rsvpStatus: 'pending' | 'attending' | 'declined';
  mealChoice: string | null;
  plusOne: boolean;
  events: string[];
}

interface GuestSummary {
  total: number;
  attending: number;
  declined: number;
  pending: number;
}

export function useGuests(search?: string) {
  return useQuery({
    queryKey: ['guests', search],
    queryFn: async () => {
      const params = search ? `?filter[name][contains]=${search}` : '';
      const response = await api.get(`/wedding/guests${params}`);
      return response.data as Guest[];
    },
  });
}

export function useGuestSummary() {
  return useQuery({
    queryKey: ['guests', 'summary'],
    queryFn: async () => {
      const response = await api.get('/wedding/guests/summary');
      return response.data as GuestSummary;
    },
  });
}

export function useCreateGuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Guest, 'id'>) => {
      const response = await api.post('/wedding/guests', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
    },
  });
}

export function useUpdateGuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Guest> & { id: string }) => {
      const response = await api.patch(`/wedding/guests/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
    },
  });
}

export function useDeleteGuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/wedding/guests/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
    },
  });
}
```

**hooks/api/use-budget.ts:**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface BudgetCategory {
  id: string;
  name: string;
  estimatedAmount: number;
  spentAmount: number;
  items: BudgetItem[];
}

interface BudgetItem {
  id: string;
  categoryId: string;
  description: string;
  amount: number;
  isPaid: boolean;
  paidDate: string | null;
  vendorName: string | null;
}

interface BudgetOverview {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  categories: BudgetCategory[];
}

export function useBudgetOverview() {
  return useQuery({
    queryKey: ['budget', 'overview'],
    queryFn: async () => {
      const response = await api.get('/wedding/budget');
      return response.data as BudgetOverview;
    },
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      categoryId: string;
      description: string;
      amount: number;
      vendorName?: string;
    }) => {
      const response = await api.post('/wedding/budget/expenses', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget'] });
      queryClient.invalidateQueries({ queryKey: ['wedding', 'stats'] });
    },
  });
}
```

**hooks/api/use-messages.ts:**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface Conversation {
  id: string;
  vendorId: string;
  vendor: {
    id: string;
    businessName: string;
    coverImage: string | null;
  };
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: 'client' | 'vendor';
  content: string;
  createdAt: string;
}

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await api.get('/messages/conversations');
      return response.data as Conversation[];
    },
  });
}

export function useMessages(conversationId: string) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const response = await api.get(`/messages/conversations/${conversationId}`);
      return response.data as Message[];
    },
    enabled: !!conversationId,
    refetchInterval: 10000, // Poll every 10 seconds when chat is open
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { conversationId: string; content: string }) => {
      const response = await api.post(
        `/messages/conversations/${data.conversationId}`,
        { content: data.content },
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['messages', variables.conversationId],
      });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
```

### 45.4 Checklist View

**components/planner/checklist-view.tsx:**

- **Progress bar** at top: `{{done}} of {{total}} tasks completed` with animated progress fill
- **Filter tabs:** All, Overdue, Upcoming, Completed
- **Task list** (FlatList):
  - Task card: checkbox (animated), title, due date, category badge
  - Checkbox toggles via `useToggleTask()` mutation
  - Haptic feedback on toggle (success type)
  - Swipe-to-complete using Reanimated gesture handler:
    ```typescript
    // Swipe right reveals green checkmark, releases to complete
    // Use react-native-gesture-handler PanGestureHandler
    // with Reanimated interpolation for the background reveal
    ```
  - Tasks grouped by month (relative to wedding date) with section headers
- **Add Task button** (floating or header):
  - Bottom sheet with: task name, due date (date picker), category (dropdown)
  - Submit via `useCreateTask()` mutation
- **Empty state** when no tasks
- Pull-to-refresh
- All text via `t()` from `checklist.*` keys

### 45.5 Guest List View

**components/planner/guest-list-view.tsx:**

- **RSVP Summary header:**
  - Three stat cards in a row: Attending (green), Declined (red), Pending (yellow)
  - Total guest count
  - Data from `useGuestSummary()`
- **Search input** to filter guests by name
- **Guest list** (FlatList):
  - Guest card: name, relationship, RSVP status badge, meal choice icon
  - Status badge colors from semantic theme tokens:
    - attending: `bg-success-50 text-success-700`
    - declined: `bg-danger-50 text-danger-700`
    - pending: `bg-warning-50 text-warning-700`
  - Swipe left to delete (with confirmation alert + heavy haptic)
  - Swipe right to edit (opens edit bottom sheet)
- **Add Guest button:**
  - Bottom sheet form: name, email, phone, side (bride/groom/both), relationship, events multi-select
  - Zod validation
  - Submit via `useCreateGuest()` mutation
  - Haptic feedback on success
- **Empty state:** "No guests added yet" with add button
- Pull-to-refresh

### 45.6 Budget View

**components/planner/budget-view.tsx:**

- **Budget header:**
  - Total budget amount (large text)
  - Progress ring/bar showing spent vs remaining
  - Spent amount and remaining amount below
  - Colors: spent = brand, remaining = success (if under) or danger (if over)
- **Pie chart** (using victory-native):
  - Category breakdown
  - Legend with category name, amount, percentage
  - All chart colors derived from brand palette (brand-200 through brand-900)
  ```typescript
  import { VictoryPie, VictoryLabel } from 'victory-native';

  <VictoryPie
    data={categories.map((c) => ({
      x: c.name,
      y: c.spentAmount,
    }))}
    colorScale={['#bac8ff', '#91a7ff', '#748ffc', '#5c7cfa', '#4c6ef5', '#4263eb']}
    innerRadius={60}
    labelRadius={90}
    style={{ labels: { fontSize: 12, fill: '#495057' } }}
  />
  ```
- **Category cards** (FlatList):
  - Category name, estimated amount, spent amount
  - Progress bar (spent / estimated)
  - Tap category → expands to show line items
  - Each line item: description, amount, paid status, vendor name
- **Add Expense button:**
  - Bottom sheet form: category (select from existing), description, amount, vendor name (optional)
  - Submit via `useCreateExpense()` mutation
- **Empty state** when no budget set

### 45.7 Messages Screen

Create a separate messages flow accessible from the Planner tab or from booking details:

**components/planner/messages-view.tsx** (or accessible from a separate icon/route):

Since messages is a sub-feature, implement as either:
- A fourth segment in the Planner tab
- OR a separate screen accessible from booking detail and a "Messages" quick action

**Conversation List:**
- Vendor avatar (or placeholder), business name, last message preview, timestamp
- Unread count badge (brand color)
- Tap → opens chat thread
- Empty state: "No messages yet"

**Chat Thread** (push onto stack — create `app/(main)/chat/[conversationId].tsx`):
- Header: vendor name, back button
- Message list (FlatList inverted for chat):
  - Sent messages: right-aligned, brand-600 background, inverse text
  - Received messages: left-aligned, surface-secondary background, content text
  - Timestamp below each message group
- Text input + send button at bottom
- KeyboardAvoidingView for proper keyboard handling
- Send via `useSendMessage()` mutation
- Light haptic on send
- Auto-scroll to bottom on new message
- Polling every 10 seconds via `refetchInterval: 10000` on `useMessages()`
- Pull up to load older messages

### 45.8 Planner Navigation Updates

Add messages access point. Options:
1. Add "Messages" as a 4th segment in the planner segmented control
2. Add a messages icon button in the planner header that navigates to a messages list screen

Also create the chat route:

```
app/(main)/
├── chat/
│   └── [conversationId].tsx   # Chat thread screen
```

## Acceptance Criteria
- [ ] Planner tab shows segmented control with Checklist, Guests, Budget
- [ ] Checklist shows tasks grouped by month with progress bar
- [ ] Checklist filter tabs (All, Overdue, Upcoming, Completed) work
- [ ] Task checkbox toggles via real API call
- [ ] Swipe-to-complete gesture works with Reanimated
- [ ] Add task bottom sheet creates task via API
- [ ] Haptic feedback on task completion (success)
- [ ] Guest list shows RSVP summary (attending/declined/pending)
- [ ] Guest search filters the list
- [ ] Add guest form validates with Zod and submits to API
- [ ] Swipe actions on guests (edit/delete) work
- [ ] Delete guest has confirmation alert with heavy haptic
- [ ] Budget header shows total, spent, remaining with progress
- [ ] Pie chart renders category breakdown with victory-native
- [ ] Category cards show progress bars and expand to line items
- [ ] Add expense bottom sheet submits to API
- [ ] Conversation list shows vendor conversations with unread badges
- [ ] Chat thread shows message bubbles (sent/received)
- [ ] Send message works via API
- [ ] Chat polls for new messages every 10 seconds
- [ ] Pull-to-refresh on all views
- [ ] Loading skeletons on all data sections
- [ ] Empty states with appropriate messages and action buttons
- [ ] All text via `t()` — no hardcoded strings
- [ ] All colors from NativeWind theme — no hardcoded colors
- [ ] TypeScript compiles with 0 errors

## Files to Create/Modify
- `apps/mobile/hooks/api/use-checklist.ts` (create)
- `apps/mobile/hooks/api/use-guests.ts` (create)
- `apps/mobile/hooks/api/use-budget.ts` (create)
- `apps/mobile/hooks/api/use-messages.ts` (create)
- `apps/mobile/components/planner/checklist-view.tsx` (create)
- `apps/mobile/components/planner/guest-list-view.tsx` (create)
- `apps/mobile/components/planner/budget-view.tsx` (create)
- `apps/mobile/components/planner/messages-view.tsx` (create)
- `apps/mobile/components/planner/add-task-sheet.tsx` (create)
- `apps/mobile/components/planner/add-guest-sheet.tsx` (create)
- `apps/mobile/components/planner/add-expense-sheet.tsx` (create)
- `apps/mobile/app/(main)/planner.tsx` (rewrite)
- `apps/mobile/app/(main)/chat/[conversationId].tsx` (create)
- `apps/mobile/i18n/en.json` (update with any new keys)
- `apps/mobile/i18n/am.json` (update with any new keys)
- `apps/mobile/package.json` (add react-native-svg, victory-native)

## Dependencies
- Task 41: Mobile App Scaffolding
- Task 42: Mobile Auth
- Task 43: Mobile Search (reusable components)
- Task 44: Mobile Dashboard (wedding hooks, booking hooks)

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
   - Set tasks.45-mobile-planning.status to "completed"
   - Set each subtask to "completed" as you finish them
   - Set tasks.45-mobile-planning.completed_at to current ISO timestamp
   - Add any important notes to tasks.45-mobile-planning.notes
6. Finally, create a git commit with message: "feat: implement 45-mobile-planning — Mobile Planning Tools — Guest List, Budget, Checklist, Messages"

DO NOT skip any part of the task. Implement everything listed in the spec.
If you encounter a blocker, update progress.json notes field with the issue and set status to "failed".
