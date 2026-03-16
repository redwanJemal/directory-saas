You are implementing task "Admin App — Layout, Sidebar, Header, Dashboard" for the Directory SaaS boilerplate project.

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
  - sidebar: pending
  - header: pending
  - routing: pending
  - dashboard-page: pending
  - placeholder-pages: pending



## TASK SPECIFICATION

# Task 31: Admin App — Layout, Navigation, Dashboard

## Summary
Build the admin app shell with a collapsible sidebar layout, header with mobile drawer, full routing setup, and a dashboard page with stat cards. This establishes the admin app's navigation structure that all subsequent admin pages plug into.

## Current State
- Admin app has shadcn/ui components (Task 28), i18n (Task 29), and auth (Task 30)
- Login flow works, ProtectedRoute redirects unauthenticated users
- App.tsx has a placeholder dashboard inside ProtectedRoute
- No sidebar, no header, no real routing, no dashboard content
- Backend endpoints available: `GET /api/v1/admin/tenants`, `GET /api/v1/health/ready`

## Required Changes

### 31.1 DashboardLayout Component

Create `apps/admin/src/components/layout/dashboard-layout.tsx`:

```typescript
import { Outlet } from 'react-router';
import { Sidebar } from './sidebar';
import { Header } from './header';

export function DashboardLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

### 31.2 Sidebar Component

Create `apps/admin/src/components/layout/sidebar.tsx`:

The sidebar must:
- Be 256px (w-64) when expanded, 68px (w-[68px]) when collapsed
- Persist collapsed state to `localStorage` key `saas_admin_sidebar_collapsed`
- Animate with `transition-all duration-300`
- Show brand logo/icon at the top (from `branding.ts`)
- Highlight active route with `bg-primary text-primary-foreground` rounded
- Show Radix Tooltip on collapsed state with `delayDuration={0}`
- Have a collapse toggle button at the bottom (ChevronLeft/ChevronRight icon)
- Be hidden on mobile (`hidden md:flex md:flex-col`)

```typescript
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Building2,
  Users,
  Shield,
  CreditCard,
  FileText,
  Layers,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { brand } from '@/lib/branding';

const STORAGE_KEY = 'saas_admin_sidebar_collapsed';

interface NavItem {
  labelKey: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { labelKey: 'nav.dashboard', href: '/', icon: LayoutDashboard },
  { labelKey: 'nav.tenants', href: '/tenants', icon: Building2 },
  { labelKey: 'nav.users', href: '/users', icon: Users },
  { labelKey: 'nav.roles', href: '/roles', icon: Shield },
  { labelKey: 'nav.subscriptions', href: '/subscriptions', icon: CreditCard },
  { labelKey: 'nav.auditLogs', href: '/audit-logs', icon: FileText },
  { labelKey: 'nav.jobs', href: '/jobs', icon: Layers },
  { labelKey: 'nav.settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(collapsed));
  }, [collapsed]);

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'hidden md:flex md:flex-col border-r border-sidebar-border bg-sidebar-background transition-all duration-300',
          collapsed ? 'w-[68px]' : 'w-64',
        )}
      >
        {/* Brand */}
        <div className={cn('flex h-14 items-center border-b border-sidebar-border px-4', collapsed && 'justify-center')}>
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              {brand.shortName}
            </div>
            {!collapsed && <span className="font-semibold text-sidebar-foreground">{brand.name}</span>}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const linkContent = (
              <Link
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  collapsed && 'justify-center px-2',
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{t(item.labelKey)}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right">{t(item.labelKey)}</TooltipContent>
                </Tooltip>
              );
            }

            return <div key={item.href}>{linkContent}</div>;
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="border-t border-sidebar-border p-2">
          <Button
            variant="ghost"
            size="icon"
            className={cn('w-full', !collapsed && 'justify-start px-3')}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!collapsed && <span className="ml-2 text-sm">Collapse</span>}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
```

### 31.3 Header Component

Create `apps/admin/src/components/layout/header.tsx`:

The header must:
- On mobile: show hamburger menu button (opens Sheet drawer with nav items) + brand logo
- Right side: LanguageSwitcher, ThemeToggle, UserMenu (avatar dropdown)
- UserMenu shows user name, email, and logout button

```typescript
import { useTranslation } from 'react-i18next';
import { Menu, LogOut, User } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuthStore } from '@/stores/auth-store';
import { brand } from '@/lib/branding';
import {
  LayoutDashboard, Building2, Users, Shield, CreditCard, FileText, Layers, Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Same nav items as sidebar for mobile drawer
const navItems = [
  { labelKey: 'nav.dashboard', href: '/', icon: LayoutDashboard },
  { labelKey: 'nav.tenants', href: '/tenants', icon: Building2 },
  { labelKey: 'nav.users', href: '/users', icon: Users },
  { labelKey: 'nav.roles', href: '/roles', icon: Shield },
  { labelKey: 'nav.subscriptions', href: '/subscriptions', icon: CreditCard },
  { labelKey: 'nav.auditLogs', href: '/audit-logs', icon: FileText },
  { labelKey: 'nav.jobs', href: '/jobs', icon: Layers },
  { labelKey: 'nav.settings', href: '/settings', icon: Settings },
];

export function Header() {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AD';

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4">
      {/* Mobile menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="border-b p-4">
            <SheetTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                {brand.shortName}
              </div>
              {brand.name}
            </SheetTitle>
          </SheetHeader>
          <nav className="space-y-1 p-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive(item.href)
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{t(item.labelKey)}</span>
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      {/* Mobile brand */}
      <div className="flex items-center gap-2 md:hidden">
        <span className="font-semibold">{brand.name}</span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side actions */}
      <div className="flex items-center gap-1">
        <LanguageSwitcher />
        <ThemeToggle />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t('auth.logout')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
```

### 31.4 Dashboard Page

Create `apps/admin/src/features/dashboard/dashboard-page.tsx`:

```typescript
import { useTranslation } from 'react-i18next';
import { Building2, Users, CreditCard, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth-store';

// Stat card data — will fetch from API when endpoints are ready
interface StatCardProps {
  titleKey: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

function StatCard({ titleKey, value, icon: Icon, description }: StatCardProps) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{t(titleKey)}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  // TODO: Replace with real API calls using TanStack Query
  const stats: StatCardProps[] = [
    { titleKey: 'dashboard.totalTenants', value: '—', icon: Building2 },
    { titleKey: 'dashboard.activeUsers', value: '—', icon: Users },
    { titleKey: 'dashboard.activeSubscriptions', value: '—', icon: CreditCard },
    { titleKey: 'dashboard.revenue', value: '—', icon: DollarSign },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground">
          {t('dashboard.welcome', { name: user?.name || 'Admin' })}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.titleKey} {...stat} />
        ))}
      </div>

      {/* Placeholder sections */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.recentTenants')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{t('common.comingSoon')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.systemHealth')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{t('common.comingSoon')}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

### 31.5 Placeholder Pages

Create placeholder page components for every nav item. Each follows this pattern:

Create `apps/admin/src/features/{name}/{name}-page.tsx`:

```typescript
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function TenantsPage() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{t('tenants.title')}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{t('tenants.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t('common.comingSoon')}</p>
        </CardContent>
      </Card>
    </div>
  );
}
```

Create these placeholder pages:
- `apps/admin/src/features/tenants/tenants-page.tsx`
- `apps/admin/src/features/users/users-page.tsx`
- `apps/admin/src/features/roles/roles-page.tsx`
- `apps/admin/src/features/subscriptions/subscriptions-page.tsx`
- `apps/admin/src/features/audit-logs/audit-logs-page.tsx`
- `apps/admin/src/features/jobs/jobs-page.tsx`
- `apps/admin/src/features/settings/settings-page.tsx`

### 31.6 Complete Routing

Update `apps/admin/src/App.tsx`:

```typescript
import { Routes, Route, Navigate } from 'react-router';
import { LoginPage } from '@/features/auth/login-page';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { DashboardPage } from '@/features/dashboard/dashboard-page';
import { TenantsPage } from '@/features/tenants/tenants-page';
import { UsersPage } from '@/features/users/users-page';
import { RolesPage } from '@/features/roles/roles-page';
import { SubscriptionsPage } from '@/features/subscriptions/subscriptions-page';
import { AuditLogsPage } from '@/features/audit-logs/audit-logs-page';
import { JobsPage } from '@/features/jobs/jobs-page';
import { SettingsPage } from '@/features/settings/settings-page';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/tenants" element={<TenantsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/roles" element={<RolesPage />} />
          <Route path="/subscriptions" element={<SubscriptionsPage />} />
          <Route path="/audit-logs" element={<AuditLogsPage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
```

### 31.7 Remove Old Files

Delete `apps/admin/src/pages/Dashboard.tsx` as it's replaced by the features-based structure.

## Acceptance Criteria
- [ ] Sidebar renders with all 8 nav items (Dashboard, Tenants, Users, Roles, Subscriptions, Audit Logs, Jobs, Settings)
- [ ] Sidebar collapses/expands with smooth animation, state persists to localStorage
- [ ] Active route is highlighted with `bg-primary text-primary-foreground`
- [ ] Collapsed sidebar shows Radix Tooltips with nav item names on hover
- [ ] Mobile hamburger menu opens Sheet drawer with nav items
- [ ] Header shows LanguageSwitcher, ThemeToggle, and UserMenu on right side
- [ ] UserMenu displays user name, email, and logout button
- [ ] All routes navigate correctly without full page reload
- [ ] Dashboard page shows 4 stat cards and placeholder sections
- [ ] All placeholder pages render with title and "Coming soon" card
- [ ] Sidebar is hidden on mobile, header shows hamburger menu
- [ ] All strings come from i18n translation files
- [ ] App builds with 0 errors

## Files to Create/Modify
- `apps/admin/src/components/layout/dashboard-layout.tsx` (create)
- `apps/admin/src/components/layout/sidebar.tsx` (create)
- `apps/admin/src/components/layout/header.tsx` (create)
- `apps/admin/src/features/dashboard/dashboard-page.tsx` (create)
- `apps/admin/src/features/tenants/tenants-page.tsx` (create)
- `apps/admin/src/features/users/users-page.tsx` (create)
- `apps/admin/src/features/roles/roles-page.tsx` (create)
- `apps/admin/src/features/subscriptions/subscriptions-page.tsx` (create)
- `apps/admin/src/features/audit-logs/audit-logs-page.tsx` (create)
- `apps/admin/src/features/jobs/jobs-page.tsx` (create)
- `apps/admin/src/features/settings/settings-page.tsx` (create)
- `apps/admin/src/App.tsx` (replace)
- `apps/admin/src/pages/Dashboard.tsx` (delete)

## Dependencies
- Task 28 (Frontend Shared Foundation) — shadcn/ui components
- Task 29 (Frontend i18n) — translation strings
- Task 30 (Frontend Auth) — auth store, login page, protected route

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
   - Set tasks.31-admin-layout.status to "completed"
   - Set each subtask to "completed" as you finish them
   - Set tasks.31-admin-layout.completed_at to current ISO timestamp
   - Add any important notes to tasks.31-admin-layout.notes
6. Finally, create a git commit with message: "feat: implement 31-admin-layout — Admin App — Layout, Sidebar, Header, Dashboard"

DO NOT skip any part of the task. Implement everything listed in the spec.
If you encounter a blocker, update progress.json notes field with the issue and set status to "failed".
