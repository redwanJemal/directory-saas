You are implementing task "Admin App — Users, Roles, Subscriptions, Audit, Jobs, Settings" for the Directory SaaS boilerplate project.

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
  - users-page: pending
  - roles-page: pending
  - subscriptions-page: pending
  - audit-logs-page: pending
  - jobs-page: pending
  - settings-page: pending



## TASK SPECIFICATION

# Task 33: Admin App — Users, Roles, Subscriptions, Audit, Jobs, Settings Pages

## Summary
Build all remaining admin pages: Users management, Roles & Permissions, Subscriptions, Audit Logs, Jobs & Queues, and Settings. Each page uses the reusable data table component from Task 32 and follows the same patterns.

## Current State
- Admin app has full layout (Task 31) and working Tenants page with data table (Task 32)
- Data table component exists with sorting, filtering, pagination
- Status badge component exists
- Remaining nav items show placeholder "Coming soon" pages
- Backend endpoints available:
  - Users: `GET /api/v1/admin/users`, `GET /api/v1/admin/users/:id`
  - Roles: `GET /api/v1/roles`, `POST /api/v1/roles`, `PATCH /api/v1/roles/:id`, `DELETE /api/v1/roles/:id`, `GET /api/v1/roles/:id/permissions`
  - Subscriptions: `GET /api/v1/admin/subscriptions`, `GET /api/v1/subscription-plans`
  - Audit: `GET /api/v1/admin/audit-logs`
  - Jobs: `GET /api/v1/admin/queues/stats`
  - Health: `GET /api/v1/health/ready`, `GET /api/v1/health/live`

## Required Changes

### 33.1 Users Page

Create `apps/admin/src/features/users/`:
```
features/users/
├── users-page.tsx
├── types.ts
├── hooks/
│   └── use-users.ts
└── components/
    └── view-user-sheet.tsx
```

**UsersPage**:
- Data table with columns: Name, Email, Type (Admin/Tenant/Client with badge), Status, Last Login (relative time format), Actions
- Filter by user type (all/admin/tenant/client)
- Search by name or email
- Pagination
- View user details in Sheet (slide-out panel): full user info, tenant association, role, login history
- No create/edit — users are created through auth/tenant flows

**TanStack Query hook** (`use-users.ts`):
```typescript
interface UsersQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: 'admin' | 'tenant' | 'client' | 'all';
  sort?: string;
}

export function useUsersQuery(params: UsersQueryParams) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      // Build query params following backend bracket notation
      if (params.search) queryParams.set('filter[name][contains]', params.search);
      if (params.type && params.type !== 'all') queryParams.set('filter[type]', params.type);
      if (params.page) queryParams.set('page', String(params.page));
      if (params.pageSize) queryParams.set('pageSize', String(params.pageSize));
      if (params.sort) queryParams.set('sort', params.sort);
      const response = await api.get(`/admin/users?${queryParams}`);
      return response.data;
    },
  });
}
```

**User type badge styling**:
- Admin: purple badge
- Tenant: blue badge
- Client: green badge

### 33.2 Roles & Permissions Page

Create `apps/admin/src/features/roles/`:
```
features/roles/
├── roles-page.tsx
├── types.ts
├── schemas.ts
├── hooks/
│   └── use-roles.ts
└── components/
    ├── create-role-dialog.tsx
    ├── edit-role-dialog.tsx
    ├── permissions-grid.tsx
    └── view-role-sheet.tsx
```

**RolesPage**:
- Data table listing all roles
- Columns: Role Name, Tenant (or "Platform" for system roles), Permissions Count, Created At, Actions
- Group/filter by tenant
- Create Role dialog: name + description + permissions selection
- Edit Role dialog: same fields, pre-populated
- Delete role (with confirmation)

**PermissionsGrid** (`permissions-grid.tsx`):
- Matrix-style checkbox grid: rows = resources (tenants, users, roles, subscriptions, etc.), columns = actions (create, read, update, delete, manage)
- Each cell is a Checkbox
- Select all row / select all column shortcuts
- Used in both Create and Edit dialogs

```typescript
interface PermissionsGridProps {
  selectedPermissions: string[];
  onPermissionsChange: (permissions: string[]) => void;
}

// Permissions follow pattern: resource:action
const resources = ['tenants', 'users', 'roles', 'subscriptions', 'audit', 'settings'];
const actions = ['create', 'read', 'update', 'delete', 'manage'];
```

**TanStack Query hooks** (`use-roles.ts`):
- `useRolesQuery(params)` — list roles
- `useCreateRoleMutation()` — create with permissions
- `useUpdateRoleMutation()` — update role + permissions
- `useDeleteRoleMutation()` — delete role

**Zod schemas** (`schemas.ts`):
```typescript
export const createRoleSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(200).optional(),
  permissions: z.array(z.string()).min(1, 'At least one permission required'),
  tenantId: z.string().uuid().optional(),
});
```

### 33.3 Subscriptions Page

Create `apps/admin/src/features/subscriptions/`:
```
features/subscriptions/
├── subscriptions-page.tsx
├── types.ts
├── hooks/
│   └── use-subscriptions.ts
└── components/
    ├── change-plan-dialog.tsx
    └── view-subscription-sheet.tsx
```

**SubscriptionsPage**:
- Data table with columns: Tenant Name, Plan Name, Status (badge), Start Date, End Date, Actions
- Filter by status (all/active/cancelled/expired)
- Sort by start date, tenant name
- View subscription details in Sheet: full subscription info, usage stats (if available), plan limits
- Change Plan dialog: dropdown with available plans, confirmation

**TanStack Query hooks** (`use-subscriptions.ts`):
- `useSubscriptionsQuery(params)` — list subscriptions
- `useSubscriptionPlansQuery()` — list available plans
- `useChangePlanMutation()` — change tenant's plan

### 33.4 Audit Logs Page

Create `apps/admin/src/features/audit-logs/`:
```
features/audit-logs/
├── audit-logs-page.tsx
├── types.ts
├── hooks/
│   └── use-audit-logs.ts
└── components/
    └── view-audit-dialog.tsx
```

**AuditLogsPage**:
- Data table with columns: Timestamp (formatted with date-fns or Intl), User (name + email), Action, Resource, Details (truncated)
- Filters:
  - Date range (two date inputs: from/to)
  - User (search/select)
  - Action type (dropdown: create, update, delete, login, logout)
  - Resource type (dropdown: tenant, user, role, subscription)
- View full audit entry in Dialog: all fields including full details JSON, before/after change diff
- Auto-refresh toggle (polling every 10 seconds when enabled)
- Sort by timestamp (default: newest first)

**Auto-refresh implementation**:
```typescript
const [autoRefresh, setAutoRefresh] = useState(false);

const { data, isLoading } = useQuery({
  queryKey: ['audit-logs', params],
  queryFn: fetchAuditLogs,
  refetchInterval: autoRefresh ? 10_000 : false,
});
```

### 33.5 Jobs & Queues Page

Create `apps/admin/src/features/jobs/`:
```
features/jobs/
├── jobs-page.tsx
├── types.ts
└── hooks/
    └── use-jobs.ts
```

**JobsPage**:
- Overview cards (grid of 6 cards, one per queue: email, notification, export, cleanup, indexing, ai)
- Each card shows: queue name, icon, pending count, active count, completed count (24h), failed count (24h)
- Card colors: pending=blue, active=green, failed=red
- Link to Bull Board dashboard: Button → opens `/api/v1/admin/queues` in new tab
- Auto-refresh: poll queue stats every 5 seconds

**Queue card component pattern**:
```typescript
interface QueueStats {
  name: string;
  pending: number;
  active: number;
  completed: number;
  failed: number;
}

function QueueCard({ stats }: { stats: QueueStats }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{stats.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>Pending: <span className="font-bold text-blue-600">{stats.pending}</span></div>
          <div>Active: <span className="font-bold text-green-600">{stats.active}</span></div>
          <div>Completed: <span className="font-bold">{stats.completed}</span></div>
          <div>Failed: <span className="font-bold text-red-600">{stats.failed}</span></div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 33.6 Settings Page

Create `apps/admin/src/features/settings/`:
```
features/settings/
├── settings-page.tsx
└── hooks/
    └── use-settings.ts
```

**SettingsPage** — Tabbed layout with:

**Platform Settings tab**:
- Form: application name, default plan (dropdown), support email
- Save button with loading state
- Toast on success

**System Health tab**:
- Fetch from `GET /api/v1/health/ready`
- Display service statuses: database, redis, meilisearch, storage
- Status indicators: green circle = healthy, red circle = unhealthy
- Auto-refresh every 30 seconds
- Last checked timestamp

**Environment Info tab**:
- Display non-sensitive environment info
- Node version, app version, environment (development/production)
- Uptime

### 33.7 Update i18n Translations

Add translation keys for all new pages to `apps/admin/src/i18n/en.json` and `am.json`. Ensure all visible strings use `t()`.

### 33.8 Date Formatting

Install `date-fns` for date formatting:
```bash
cd apps/admin && npm install date-fns
```

Use throughout for consistent formatting:
```typescript
import { format, formatDistanceToNow } from 'date-fns';

// Full date: "Mar 15, 2026"
format(new Date(timestamp), 'MMM d, yyyy');

// Relative: "2 hours ago"
formatDistanceToNow(new Date(timestamp), { addSuffix: true });
```

## Acceptance Criteria
- [ ] Users page: data table loads users, filter by type, search by name/email, view user details in Sheet
- [ ] Roles page: list roles, create/edit with permissions grid, delete with confirmation
- [ ] Permissions grid: checkbox matrix for resource x action, working select/deselect
- [ ] Subscriptions page: list subscriptions, filter by status, view details, change plan dialog
- [ ] Audit Logs page: data table with date range, user, action, resource filters; view full entry; auto-refresh toggle
- [ ] Jobs page: queue stats cards for all 6 queues, auto-refresh, link to Bull Board
- [ ] Settings page: platform settings form, system health display, environment info
- [ ] All pages use TanStack Query hooks for data fetching
- [ ] All forms use Zod validation
- [ ] All strings use i18n translations
- [ ] Toast notifications on success/error for all mutations
- [ ] All pages are responsive on mobile
- [ ] Admin app builds with 0 errors

## Files to Create/Modify
- `apps/admin/src/features/users/users-page.tsx` (replace placeholder)
- `apps/admin/src/features/users/types.ts` (create)
- `apps/admin/src/features/users/hooks/use-users.ts` (create)
- `apps/admin/src/features/users/components/view-user-sheet.tsx` (create)
- `apps/admin/src/features/roles/roles-page.tsx` (replace placeholder)
- `apps/admin/src/features/roles/types.ts` (create)
- `apps/admin/src/features/roles/schemas.ts` (create)
- `apps/admin/src/features/roles/hooks/use-roles.ts` (create)
- `apps/admin/src/features/roles/components/create-role-dialog.tsx` (create)
- `apps/admin/src/features/roles/components/edit-role-dialog.tsx` (create)
- `apps/admin/src/features/roles/components/permissions-grid.tsx` (create)
- `apps/admin/src/features/roles/components/view-role-sheet.tsx` (create)
- `apps/admin/src/features/subscriptions/subscriptions-page.tsx` (replace placeholder)
- `apps/admin/src/features/subscriptions/types.ts` (create)
- `apps/admin/src/features/subscriptions/hooks/use-subscriptions.ts` (create)
- `apps/admin/src/features/subscriptions/components/change-plan-dialog.tsx` (create)
- `apps/admin/src/features/subscriptions/components/view-subscription-sheet.tsx` (create)
- `apps/admin/src/features/audit-logs/audit-logs-page.tsx` (replace placeholder)
- `apps/admin/src/features/audit-logs/types.ts` (create)
- `apps/admin/src/features/audit-logs/hooks/use-audit-logs.ts` (create)
- `apps/admin/src/features/audit-logs/components/view-audit-dialog.tsx` (create)
- `apps/admin/src/features/jobs/jobs-page.tsx` (replace placeholder)
- `apps/admin/src/features/jobs/types.ts` (create)
- `apps/admin/src/features/jobs/hooks/use-jobs.ts` (create)
- `apps/admin/src/features/settings/settings-page.tsx` (replace placeholder)
- `apps/admin/src/features/settings/hooks/use-settings.ts` (create)
- `apps/admin/src/i18n/en.json` (modify — add new translation keys)
- `apps/admin/src/i18n/am.json` (modify — add new translation keys)

## Dependencies
- Task 28 (Frontend Shared Foundation) — shadcn/ui components
- Task 29 (Frontend i18n) — translation setup
- Task 30 (Frontend Auth) — auth store, API client
- Task 31 (Admin Layout) — DashboardLayout, sidebar routing
- Task 32 (Admin Tenants) — data table component, status badge

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
   - Set tasks.33-admin-pages.status to "completed"
   - Set each subtask to "completed" as you finish them
   - Set tasks.33-admin-pages.completed_at to current ISO timestamp
   - Add any important notes to tasks.33-admin-pages.notes
6. Finally, create a git commit with message: "feat: implement 33-admin-pages — Admin App — Users, Roles, Subscriptions, Audit, Jobs, Settings"

DO NOT skip any part of the task. Implement everything listed in the spec.
If you encounter a blocker, update progress.json notes field with the issue and set status to "failed".
