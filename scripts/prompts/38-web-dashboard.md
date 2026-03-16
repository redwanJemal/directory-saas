You are implementing task "Web App — Client Dashboard, Wedding Planner Tools" for the Directory SaaS boilerplate project.

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
  - dashboard-layout: pending
  - dashboard-page: pending
  - wedding-page: pending
  - guest-list-page: pending
  - budget-page: pending
  - checklist-page: pending
  - vendors-page: pending
  - messages-page: pending



## TASK SPECIFICATION

# Task 38: Web App — Client Dashboard, Wedding Planner

## Summary
Build the authenticated client dashboard with wedding planning features: wedding overview, guest list management, budget tracker with charts, checklist/timeline, booked vendors list, messages, and settings. This is the private area for registered clients to plan their events.

## Current State
- Web app has public layout, landing page, search, vendor profiles (Task 37)
- Auth flow works for client users (login + register)
- ProtectedRoute wraps `/dashboard` with a placeholder
- No dashboard layout, no planning features, no data pages
- Backend endpoints available:
  - Wedding: `GET/PATCH /api/v1/weddings/me`
  - Guests: `GET /api/v1/weddings/me/guests`, CRUD endpoints
  - Budget: `GET /api/v1/weddings/me/budget`, CRUD endpoints
  - Checklist: `GET /api/v1/weddings/me/checklist`, CRUD endpoints
  - Bookings: `GET /api/v1/bookings/me` (client's bookings)
  - Messages: `GET /api/v1/conversations`, `POST /api/v1/conversations/:id/messages`

## Required Changes

### 38.1 Install Dependencies

```bash
cd apps/web && npm install @tanstack/react-table recharts
```

### 38.2 Dashboard Layout

Create `apps/web/src/components/layout/dashboard-layout.tsx`:

Same collapsible sidebar pattern as admin/provider apps:

```typescript
import { Outlet } from 'react-router';
import { DashboardSidebar } from './dashboard-sidebar';
import { DashboardHeader } from './dashboard-header';

export function DashboardLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

### 38.3 Dashboard Sidebar

Create `apps/web/src/components/layout/dashboard-sidebar.tsx`:

Same collapsible sidebar pattern, with client-specific nav items:

```typescript
const navItems: NavItem[] = [
  { labelKey: 'nav.dashboard', href: '/dashboard', icon: LayoutDashboard },
  { labelKey: 'nav.myWedding', href: '/dashboard/wedding', icon: Heart },
  { labelKey: 'nav.guestList', href: '/dashboard/guests', icon: Users },
  { labelKey: 'nav.budget', href: '/dashboard/budget', icon: DollarSign },
  { labelKey: 'nav.checklist', href: '/dashboard/checklist', icon: CheckSquare },
  { labelKey: 'nav.vendors', href: '/dashboard/vendors', icon: Store },
  { labelKey: 'nav.messages', href: '/dashboard/messages', icon: MessageSquare },
  { labelKey: 'nav.settings', href: '/dashboard/settings', icon: Settings },
];
```

Storage key: `saas_web_sidebar_collapsed`

All other behavior identical to admin sidebar pattern.

### 38.4 Dashboard Header

Create `apps/web/src/components/layout/dashboard-header.tsx`:

Same header pattern: mobile hamburger menu (Sheet), LanguageSwitcher, ThemeToggle, UserMenu.

Add a "Back to Search" link button that returns to the public site (`/`).

### 38.5 Client Dashboard Page

Create `apps/web/src/features/dashboard/client-dashboard-page.tsx`:

- Wedding overview card at top:
  - Wedding title, date, venue
  - Countdown: "XX days to go!" (calculated from wedding date)
  - Visual countdown with date-fns `differenceInDays`

- Quick stats row (4 cards):
  - Vendors Booked (count / icon)
  - Guests Confirmed (confirmed / total)
  - Budget Spent (spent / total with percentage)
  - Tasks Done (completed / total with percentage)

- Two-column grid below:
  - Upcoming Tasks: next 5 checklist items sorted by due date, each with checkbox, title, due date, vendor category
  - Recent Messages: last 3 conversations with sender name, preview text, timestamp

```typescript
function CountdownCard({ weddingDate }: { weddingDate: string }) {
  const daysLeft = differenceInDays(new Date(weddingDate), new Date());
  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
      <CardContent className="p-6 text-center">
        <div className="text-5xl font-bold text-primary">{daysLeft}</div>
        <p className="text-muted-foreground">{t('dashboard.countdown', { days: daysLeft })}</p>
      </CardContent>
    </Card>
  );
}
```

### 38.6 My Wedding Page

Create `apps/web/src/features/wedding/`:
```
features/wedding/
├── wedding-page.tsx
├── types.ts
├── schemas.ts
├── hooks/
│   └── use-wedding.ts
└── components/
    ├── wedding-form.tsx
    ├── events-manager.tsx
    └── collaborators-manager.tsx
```

**WeddingPage** — Tabbed layout:

**Wedding Details tab**:
- Form: title, date (date picker), estimated guest count (number), venue, style preferences (multi-select tags)
- Save button
- Zod validation

**Events tab** (EventsManager):
- List of sub-events (ceremony, reception, rehearsal dinner, etc.)
- Add event: name, date, time, venue, notes
- Edit/delete events
- Each event card shows name, date/time, venue

**Collaborators tab** (CollaboratorsManager):
- List current collaborators (partner, family, wedding planner)
- Invite collaborator: email + role (editor/viewer)
- Remove collaborator

### 38.7 Guest List Page

Create `apps/web/src/features/guests/`:
```
features/guests/
├── guest-list-page.tsx
├── types.ts
├── schemas.ts
├── hooks/
│   └── use-guests.ts
└── components/
    ├── add-guest-dialog.tsx
    ├── import-csv-dialog.tsx
    ├── rsvp-summary.tsx
    └── guest-table-columns.tsx
```

**GuestListPage**:
- RSVP summary dashboard at top:
  - Cards: Total Invited, Attending, Declined, Pending
  - Per-event tabs showing RSVP breakdown

- Data table (replicate data-table component from admin or install @tanstack/react-table):
  - Columns: Name, Group (family/friends/colleagues), Side (bride/groom/mutual), Events (badges), RSVP Status (badge), Meal Choice, Actions
  - Search by name
  - Filter by RSVP status, group, side, event
  - Sort by name, RSVP status

- "Add Guest" button → AddGuestDialog:
  - Form: name, email (optional), phone (optional), group (select), side (select), events (checkbox list), dietary notes
  - Zod validation

- "Import CSV" button → ImportCsvDialog:
  - File upload (CSV)
  - Preview parsed data in table
  - Confirm import
  - Template CSV download link

- Bulk actions: select multiple guests → invite (send email), remind, delete

**RSVP Summary component**:
```typescript
function RSVPSummary({ guests, events }: RSVPSummaryProps) {
  const attending = guests.filter(g => g.rsvp === 'attending').length;
  const declined = guests.filter(g => g.rsvp === 'declined').length;
  const pending = guests.filter(g => g.rsvp === 'pending').length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard label="Total Invited" value={guests.length} icon={Users} />
      <StatCard label="Attending" value={attending} icon={UserCheck} variant="success" />
      <StatCard label="Declined" value={declined} icon={UserX} variant="destructive" />
      <StatCard label="Pending" value={pending} icon={Clock} variant="warning" />
    </div>
  );
}
```

### 38.8 Budget Page

Create `apps/web/src/features/budget/`:
```
features/budget/
├── budget-page.tsx
├── types.ts
├── schemas.ts
├── hooks/
│   └── use-budget.ts
└── components/
    ├── budget-summary.tsx
    ├── budget-category-card.tsx
    ├── add-budget-item-dialog.tsx
    ├── budget-pie-chart.tsx
    └── budget-bar-chart.tsx
```

**BudgetPage**:
- Summary header: Total Budget (editable), Spent, Remaining, percentage bar

- Budget category cards (grid):
  - Each category: name (Venue, Catering, Photography, etc.), estimated total, actual total, progress bar
  - Click card to expand and see line items
  - Add item button per category

- Charts section (recharts):
  - Pie chart: spending by category
  - Bar chart: estimated vs actual per category

**Budget Summary**:
```typescript
function BudgetSummary({ totalBudget, spent }: BudgetSummaryProps) {
  const remaining = totalBudget - spent;
  const percentage = totalBudget > 0 ? (spent / totalBudget) * 100 : 0;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-muted-foreground">{t('budget.totalBudget')}</p>
            <p className="text-2xl font-bold">{formatCurrency(totalBudget)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('budget.spent')}</p>
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(spent)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('budget.remaining')}</p>
            <p className={cn('text-2xl font-bold', remaining >= 0 ? 'text-green-600' : 'text-red-600')}>
              {formatCurrency(remaining)}
            </p>
          </div>
        </div>
        <Progress value={percentage} className="mt-4" />
      </CardContent>
    </Card>
  );
}
```

**AddBudgetItemDialog**:
- Form: category (select), name, estimated amount, actual amount, paid amount, vendor (link to booked vendor), notes
- Zod validation

**Charts**:
```typescript
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

function BudgetPieChart({ data }: { data: Array<{ category: string; amount: number }> }) {
  const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={data} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={100} label>
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}
```

### 38.9 Checklist Page

Create `apps/web/src/features/checklist/`:
```
features/checklist/
├── checklist-page.tsx
├── types.ts
├── schemas.ts
├── hooks/
│   └── use-checklist.ts
└── components/
    ├── task-card.tsx
    ├── add-task-dialog.tsx
    └── checklist-progress.tsx
```

**ChecklistPage**:
- Progress bar at top: "X of Y complete" with percentage
- Filter tabs: All, Overdue (red count badge), Upcoming, Completed
- Timeline view grouped by month (use date-fns `format(date, 'MMMM yyyy')`)
- Each month section: month header + list of task cards

**TaskCard**:
- Checkbox (toggles completion), title, due date (red if overdue), assigned to label, vendor category link
- Click to expand: description, notes
- Edit/delete actions

**AddTaskDialog**:
- Form: title, description, due date (date picker), assigned to (select from collaborators), vendor category (optional link)
- Zod validation

### 38.10 My Vendors Page

Create `apps/web/src/features/vendors/my-vendors-page.tsx`:

- Grid of vendor cards (different from search vendor cards — these show booking status)
- Each card: vendor photo, name, category, booking status badge, package name, event date
- Click to see booking detail (same BookingDetailSheet pattern)
- "Quick Message" button per vendor (opens messages with that vendor)
- "Find More Vendors" link button → navigates to `/search`

### 38.11 Messages Page

Create `apps/web/src/features/messages/`:

Same message pattern as provider portal (Task 36):
- Conversation list (left) + message thread (right)
- Mobile: full-screen conversation list → full-screen thread
- Send messages, polling for new messages

### 38.12 Settings Page

Create `apps/web/src/features/settings/`:

Tabbed layout:
- Account: name, email, change password
- Notifications: toggle switches for email notifications
- Wedding Website: toggle public/private, custom URL slug, share link

### 38.13 Update Routing

Update `apps/web/src/App.tsx` to include all dashboard routes:

```typescript
<Routes>
  {/* Public routes */}
  <Route element={<PublicLayout />}>
    <Route path="/" element={<LandingPage />} />
    <Route path="/search" element={<VendorSearchPage />} />
    <Route path="/vendors/:vendorId" element={<VendorProfilePage />} />
    <Route path="/categories" element={<CategoriesPage />} />
  </Route>

  {/* Auth routes */}
  <Route path="/login" element={<LoginPage />} />
  <Route path="/register" element={<RegisterPage />} />

  {/* Protected dashboard routes */}
  <Route element={<ProtectedRoute />}>
    <Route element={<DashboardLayout />}>
      <Route path="/dashboard" element={<ClientDashboardPage />} />
      <Route path="/dashboard/wedding" element={<WeddingPage />} />
      <Route path="/dashboard/guests" element={<GuestListPage />} />
      <Route path="/dashboard/budget" element={<BudgetPage />} />
      <Route path="/dashboard/checklist" element={<ChecklistPage />} />
      <Route path="/dashboard/vendors" element={<MyVendorsPage />} />
      <Route path="/dashboard/messages" element={<MessagesPage />} />
      <Route path="/dashboard/settings" element={<SettingsPage />} />
    </Route>
  </Route>

  <Route path="*" element={<Navigate to="/" replace />} />
</Routes>
```

### 38.14 Replicate Data Table & Status Badge

Copy data-table component and status-badge component into the web app (same as admin/provider):

```
apps/web/src/components/data-table/
├── data-table.tsx
├── data-table-pagination.tsx
├── data-table-toolbar.tsx
├── data-table-row-actions.tsx
├── data-table-column-header.tsx
└── index.ts
```

### 38.15 Update i18n

Add all new translation keys to `apps/web/src/i18n/en.json` and `am.json` for: dashboard, wedding, guestList, budget, checklist, messages, settings namespaces.

## Acceptance Criteria
- [ ] Dashboard layout: collapsible sidebar with client nav items, header with mobile menu
- [ ] Dashboard page: wedding countdown, 4 stat cards, upcoming tasks, recent messages
- [ ] My Wedding page: form for wedding details, events management, collaborators
- [ ] Guest list: data table with search/filter, RSVP summary cards, add guest dialog, CSV import
- [ ] Budget: summary header with progress, category cards, add item dialog, pie chart + bar chart
- [ ] Checklist: progress bar, month-grouped timeline, task cards with checkbox, filter tabs (overdue/upcoming/completed)
- [ ] My Vendors: grid of booked vendors with status, quick message button
- [ ] Messages: conversation list + thread, send/receive messages, polling
- [ ] Settings: account, notifications, wedding website tabs
- [ ] "Back to Search" link in header returns to public site
- [ ] All pages use TanStack Query for data
- [ ] All forms validate with Zod
- [ ] All strings from i18n
- [ ] Responsive on mobile
- [ ] Web app builds with 0 errors

## Files to Create/Modify
- `apps/web/src/components/layout/dashboard-layout.tsx` (create)
- `apps/web/src/components/layout/dashboard-sidebar.tsx` (create)
- `apps/web/src/components/layout/dashboard-header.tsx` (create)
- `apps/web/src/components/data-table/*.tsx` (create — copy from admin)
- `apps/web/src/components/status-badge.tsx` (create)
- `apps/web/src/features/dashboard/client-dashboard-page.tsx` (create)
- `apps/web/src/features/wedding/wedding-page.tsx` (create)
- `apps/web/src/features/wedding/types.ts` (create)
- `apps/web/src/features/wedding/schemas.ts` (create)
- `apps/web/src/features/wedding/hooks/use-wedding.ts` (create)
- `apps/web/src/features/wedding/components/*.tsx` (create)
- `apps/web/src/features/guests/guest-list-page.tsx` (create)
- `apps/web/src/features/guests/types.ts` (create)
- `apps/web/src/features/guests/schemas.ts` (create)
- `apps/web/src/features/guests/hooks/use-guests.ts` (create)
- `apps/web/src/features/guests/components/*.tsx` (create)
- `apps/web/src/features/budget/budget-page.tsx` (create)
- `apps/web/src/features/budget/types.ts` (create)
- `apps/web/src/features/budget/schemas.ts` (create)
- `apps/web/src/features/budget/hooks/use-budget.ts` (create)
- `apps/web/src/features/budget/components/*.tsx` (create)
- `apps/web/src/features/checklist/checklist-page.tsx` (create)
- `apps/web/src/features/checklist/types.ts` (create)
- `apps/web/src/features/checklist/schemas.ts` (create)
- `apps/web/src/features/checklist/hooks/use-checklist.ts` (create)
- `apps/web/src/features/checklist/components/*.tsx` (create)
- `apps/web/src/features/vendors/my-vendors-page.tsx` (create)
- `apps/web/src/features/messages/messages-page.tsx` (create)
- `apps/web/src/features/messages/types.ts` (create)
- `apps/web/src/features/messages/hooks/use-messages.ts` (create)
- `apps/web/src/features/messages/components/*.tsx` (create)
- `apps/web/src/features/settings/settings-page.tsx` (create)
- `apps/web/src/App.tsx` (replace — update routing)
- `apps/web/src/i18n/en.json` (modify)
- `apps/web/src/i18n/am.json` (modify)

## Dependencies
- Task 28 (Frontend Shared Foundation) — shadcn/ui components
- Task 29 (Frontend i18n) — translation strings
- Task 30 (Frontend Auth) — auth store, protected route
- Task 37 (Web Public) — public layout, landing, search pages, vendor profile

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
   - Set tasks.38-web-dashboard.status to "completed"
   - Set each subtask to "completed" as you finish them
   - Set tasks.38-web-dashboard.completed_at to current ISO timestamp
   - Add any important notes to tasks.38-web-dashboard.notes
6. Finally, create a git commit with message: "feat: implement 38-web-dashboard — Web App — Client Dashboard, Wedding Planner Tools"

DO NOT skip any part of the task. Implement everything listed in the spec.
If you encounter a blocker, update progress.json notes field with the issue and set status to "failed".
