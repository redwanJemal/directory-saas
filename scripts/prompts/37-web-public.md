You are implementing task "Web App — Public Layout, Landing Page, Vendor Search" for the Directory SaaS boilerplate project.

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
  - public-layout: pending
  - landing-page: pending
  - vendor-search: pending
  - vendor-profile: pending
  - categories-page: pending



## TASK SPECIFICATION

# Task 37: Web App — Public Layout, Landing Page, Vendor Search

## Summary
Build the public-facing client web app: public layout with header/footer, hero landing page, vendor search with filters/sort/pagination, vendor profile page with portfolio/packages/reviews/FAQ, and category browsing. These are the unauthenticated pages that make up the marketplace experience.

## Current State
- Web app has shadcn/ui components (Task 28), i18n (Task 29), and auth (Task 30)
- App.tsx has placeholder routes (landing, login, register, protected dashboard)
- No public layout, no landing page, no search, no vendor profiles
- Backend endpoints available:
  - Search: `GET /api/v1/search/providers` (Meilisearch-backed with filters)
  - Providers: `GET /api/v1/providers/:id` (public profile)
  - Categories: `GET /api/v1/categories`
  - Inquiries: `POST /api/v1/inquiries`

## Required Changes

### 37.1 Install Dependencies

```bash
cd apps/web && npm install date-fns
```

### 37.2 Public Layout

Create `apps/web/src/components/layout/public-layout.tsx`:

```typescript
import { Outlet } from 'react-router';
import { PublicHeader } from './public-header';
import { PublicFooter } from './public-footer';

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
```

### 37.3 Public Header

Create `apps/web/src/components/layout/public-header.tsx`:

```typescript
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuthStore } from '@/stores/auth-store';
import { brand } from '@/lib/branding';

export function PublicHeader() {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuthStore();

  const navLinks = [
    { label: t('nav.search'), href: '/search' },
    { label: t('nav.categories'), href: '/categories' },
    { label: t('nav.howItWorks'), href: '/#how-it-works' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            {brand.shortName}
          </div>
          <span className="font-semibold text-lg hidden sm:inline">{brand.name}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link key={link.href} to={link.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <Button variant="default" asChild>
                <Link to="/dashboard">{t('nav.dashboard')}</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login">{t('nav.login')}</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">{t('nav.signUp')}</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>{brand.name}</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-6">
                {navLinks.map((link) => (
                  <Link key={link.href} to={link.href} className="text-sm font-medium">
                    {link.label}
                  </Link>
                ))}
                <div className="border-t pt-4 flex flex-col gap-2">
                  {isAuthenticated ? (
                    <Button asChild><Link to="/dashboard">{t('nav.dashboard')}</Link></Button>
                  ) : (
                    <>
                      <Button variant="outline" asChild><Link to="/login">{t('nav.login')}</Link></Button>
                      <Button asChild><Link to="/register">{t('nav.signUp')}</Link></Button>
                    </>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
```

### 37.4 Public Footer

Create `apps/web/src/components/layout/public-footer.tsx`:

- Container with 3-4 column grid (responsive)
- Column 1: brand logo + description
- Column 2: Quick Links (Search, Categories, How It Works)
- Column 3: Legal (Privacy Policy, Terms of Service, Contact)
- Column 4: Social icons (placeholder links)
- Bottom bar: copyright text

### 37.5 Landing Page

Create `apps/web/src/features/landing/landing-page.tsx`:

**Hero Section**:
- Full-width background (gradient using brand colors)
- Large headline: `t('landing.heroTitle')`
- Subheadline: `t('landing.heroSubtitle')`
- Search bar: 3 inline fields (Category select, Location input, Date input) + Search button
- Search form submits to `/search?category=X&location=Y&date=Z`

```typescript
function HeroSection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (location) params.set('location', location);
    navigate(`/search?${params}`);
  };

  return (
    <section className="relative bg-gradient-to-br from-primary/10 via-background to-primary/5 py-20 md:py-32">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">{t('landing.heroTitle')}</h1>
        <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          {t('landing.heroSubtitle')}
        </p>
        <form onSubmit={handleSearch} className="mt-8 mx-auto max-w-3xl">
          <div className="flex flex-col sm:flex-row gap-2 bg-card rounded-xl p-2 shadow-lg border">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={t('landing.searchCategory')} />
              </SelectTrigger>
              <SelectContent>
                {/* Categories populated from API or static list */}
              </SelectContent>
            </Select>
            <Input
              placeholder={t('landing.searchLocation')}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="lg">
              <Search className="mr-2 h-4 w-4" />
              {t('landing.searchButton')}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
```

**Featured Vendors Section**:
- Grid of 4-6 vendor cards (fetched from API or placeholder data)
- Each card: image, name, category, location, rating stars, starting price
- "View All" link to search page

**How It Works Section**:
- 3 cards in a row: Search, Compare, Book
- Each card: icon (from Lucide), title, description
- Animated or styled step numbers

**Categories Section**:
- Grid of category cards (8-12 categories)
- Each card: icon, category name, vendor count
- Click navigates to `/search?category=X`

**Testimonials Section**:
- 3 testimonial cards
- Each: quote text, customer name, photo (placeholder avatar)
- Styled with quote marks

**CTA Section**:
- Background gradient
- Headline + subtitle + large CTA button
- Button links to `/register`

### 37.6 Vendor Search Page

Create `apps/web/src/features/search/`:
```
features/search/
├── vendor-search-page.tsx
├── types.ts
├── hooks/
│   └── use-search.ts
└── components/
    ├── search-bar.tsx
    ├── filter-sidebar.tsx
    ├── vendor-card.tsx
    └── search-results.tsx
```

**VendorSearchPage**:
- Search bar across top (category + location + date)
- Two-column layout (desktop): filter sidebar (left, 280px) + results grid (right)
- Mobile: filters in Sheet (triggered by "Filters" button)
- URL query params drive all state (synced with useState + useSearchParams)

**FilterSidebar**:
- Category: select dropdown (all categories)
- Budget Range: dual range slider (min/max) or two number inputs
- Rating: minimum rating (radio buttons: Any, 3+, 4+, 4.5+)
- Style Tags: checkbox list (Elegant, Modern, Rustic, Bohemian, etc.)
- Languages: checkbox list
- "Clear Filters" button
- On mobile: wrapped in Sheet component

**SearchBar** (reusable, shown on search page and landing page):
- Category select, Location input, optional date input
- Search button
- Compact variant for search results page header

**VendorCard**:
```typescript
function VendorCard({ vendor }: { vendor: VendorSearchResult }) {
  return (
    <Link to={`/vendors/${vendor.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="aspect-[4/3] relative overflow-hidden">
          <img src={vendor.coverPhoto || '/placeholder.jpg'} alt={vendor.name}
            className="object-cover w-full h-full" />
          {vendor.featured && (
            <Badge className="absolute top-2 left-2">Featured</Badge>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold truncate">{vendor.name}</h3>
          <p className="text-sm text-muted-foreground">{vendor.category} · {vendor.location}</p>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{vendor.rating.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({vendor.reviewCount})</span>
            </div>
            <span className="text-sm font-medium">
              {t('search.startingFrom', { price: formatCurrency(vendor.startingPrice) })}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
```

**SearchResults**:
- Header: result count, sort dropdown (Recommended, Rating, Price Low-High, Price High-Low, Most Reviewed)
- Grid: responsive (1 col mobile, 2 col tablet, 3 col desktop)
- Pagination at bottom
- Loading: skeleton grid (6 skeleton cards)
- Empty state: illustration + "No vendors found" + "Clear Filters" button
- Optional: Map/List view toggle (map view is placeholder — just show the toggle and a "Map coming soon" card)

**TanStack Query hook** (`use-search.ts`):
```typescript
export function useSearchQuery(params: SearchParams) {
  return useQuery({
    queryKey: ['vendor-search', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params.query) queryParams.set('q', params.query);
      if (params.category) queryParams.set('filter[category]', params.category);
      if (params.location) queryParams.set('filter[location]', params.location);
      if (params.minBudget) queryParams.set('filter[price][gte]', String(params.minBudget));
      if (params.maxBudget) queryParams.set('filter[price][lte]', String(params.maxBudget));
      if (params.minRating) queryParams.set('filter[rating][gte]', String(params.minRating));
      if (params.sort) queryParams.set('sort', params.sort);
      if (params.page) queryParams.set('page', String(params.page));
      if (params.pageSize) queryParams.set('pageSize', String(params.pageSize));

      const response = await api.get(`/search/providers?${queryParams}`);
      return response.data;
    },
    placeholderData: (prev) => prev, // Keep showing previous data while loading
  });
}
```

### 37.7 Vendor Profile Page

Create `apps/web/src/features/search/vendor-profile-page.tsx`:

- Route: `/vendors/:vendorId`
- Fetch vendor from `GET /api/v1/providers/:id`

**Hero section**:
- Cover photo (full-width, 300px height)
- Vendor name, category, location overlaid on cover
- Star rating + review count
- "Request Quote" CTA button

**Tabbed content** (Tabs component):

**About tab**:
- Description (rich text)
- Business info: styles, languages, contact
- Location info

**Portfolio tab**:
- Masonry-style image grid (CSS columns or grid with varying heights)
- Click image → lightbox (Dialog with large image, prev/next navigation)
- Simple lightbox implementation:
```typescript
function Lightbox({ images, currentIndex, onClose, onNext, onPrev }: LightboxProps) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0">
        <div className="relative">
          <img src={images[currentIndex].url} className="w-full max-h-[80vh] object-contain" />
          <Button variant="ghost" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2" onClick={onPrev}>
            <ChevronLeft />
          </Button>
          <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2" onClick={onNext}>
            <ChevronRight />
          </Button>
        </div>
        <div className="p-4">
          <p className="font-medium">{images[currentIndex].title}</p>
          <p className="text-sm text-muted-foreground">{images[currentIndex].description}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**Packages tab**:
- Package comparison cards (side by side on desktop, stacked on mobile)
- Each card: name, price, description, inclusions list (checkmarks)
- "Request Quote" button per package

**Reviews tab**:
- Rating summary (same component pattern as provider reviews)
- Review list: star rating, reviewer name, date, text
- Pagination for reviews

**FAQ tab**:
- Accordion component with question/answer pairs

**Sticky sidebar (desktop)**:
- Fixed position on right side
- "Request Quote" button
- Starting price display
- Response time indicator
- Contact info

**Inquiry Form Dialog** (opened by "Request Quote"):
- Form fields: event date (date picker), guest count (number), budget range (select), message (textarea)
- Zod validation
- Submit to `POST /api/v1/inquiries`
- Success message: "Inquiry sent! The vendor will respond shortly."

### 37.8 Categories Page

Create `apps/web/src/features/categories/categories-page.tsx`:

- Grid of category cards
- Each card: icon (Lucide icon mapped to category), category name, vendor count
- Click navigates to `/search?category=X`
- Fetch from `GET /api/v1/categories`

### 37.9 Update Routing

Update `apps/web/src/App.tsx`:

```typescript
import { Routes, Route, Navigate } from 'react-router';
import { PublicLayout } from '@/components/layout/public-layout';
import { LoginPage } from '@/features/auth/login-page';
import { RegisterPage } from '@/features/auth/register-page';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { LandingPage } from '@/features/landing/landing-page';
import { VendorSearchPage } from '@/features/search/vendor-search-page';
import { VendorProfilePage } from '@/features/search/vendor-profile-page';
import { CategoriesPage } from '@/features/categories/categories-page';

export default function App() {
  return (
    <Routes>
      {/* Public routes with PublicLayout */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/search" element={<VendorSearchPage />} />
        <Route path="/vendors/:vendorId" element={<VendorProfilePage />} />
        <Route path="/categories" element={<CategoriesPage />} />
      </Route>

      {/* Auth routes (no layout wrapper) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected dashboard routes (will be implemented in Task 38) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<div>Dashboard placeholder</div>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
```

### 37.10 Utility Functions

Create `apps/web/src/lib/format.ts`:

```typescript
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(date));
}

export function formatRelativeDate(date: string | Date): string {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days < 30) return rtf.format(-days, 'day');
  if (days < 365) return rtf.format(-Math.floor(days / 30), 'month');
  return rtf.format(-Math.floor(days / 365), 'year');
}
```

## Acceptance Criteria
- [ ] Public header: logo, nav links, auth buttons (Login/Sign Up or Dashboard if authenticated), mobile menu
- [ ] Public footer: brand info, quick links, legal links, copyright
- [ ] Landing page: hero with search bar, featured vendors, how it works, categories grid, testimonials, CTA
- [ ] Hero search bar navigates to search page with query params
- [ ] Vendor search: search bar, filter sidebar (category, budget, rating, style, languages), results grid
- [ ] Search: server-side filtering, sorting (5 options), pagination
- [ ] Search: loading skeletons, empty state with "No results" message
- [ ] Mobile search: filters open in Sheet
- [ ] Vendor cards: cover photo, name, category, location, rating, starting price
- [ ] Vendor profile page: hero with cover, tabbed content (About, Portfolio, Packages, Reviews, FAQ)
- [ ] Portfolio: masonry grid with lightbox
- [ ] Packages: comparison cards with inclusions
- [ ] Reviews: rating summary + review list
- [ ] FAQ: accordion
- [ ] Inquiry form: validates with Zod, submits to API, shows success message
- [ ] Categories page: grid of categories with vendor counts
- [ ] All URL query params synced with filters/search state
- [ ] All strings from i18n
- [ ] Responsive on mobile
- [ ] Web app builds with 0 errors

## Files to Create/Modify
- `apps/web/src/components/layout/public-layout.tsx` (create)
- `apps/web/src/components/layout/public-header.tsx` (create)
- `apps/web/src/components/layout/public-footer.tsx` (create)
- `apps/web/src/features/landing/landing-page.tsx` (create)
- `apps/web/src/features/search/vendor-search-page.tsx` (create)
- `apps/web/src/features/search/vendor-profile-page.tsx` (create)
- `apps/web/src/features/search/types.ts` (create)
- `apps/web/src/features/search/hooks/use-search.ts` (create)
- `apps/web/src/features/search/components/search-bar.tsx` (create)
- `apps/web/src/features/search/components/filter-sidebar.tsx` (create)
- `apps/web/src/features/search/components/vendor-card.tsx` (create)
- `apps/web/src/features/search/components/search-results.tsx` (create)
- `apps/web/src/features/search/components/lightbox.tsx` (create)
- `apps/web/src/features/search/components/inquiry-form-dialog.tsx` (create)
- `apps/web/src/features/categories/categories-page.tsx` (create)
- `apps/web/src/lib/format.ts` (create)
- `apps/web/src/App.tsx` (replace)

## Dependencies
- Task 28 (Frontend Shared Foundation) — shadcn/ui components
- Task 29 (Frontend i18n) — translation strings
- Task 30 (Frontend Auth) — auth store, login/register pages

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
   - Set tasks.37-web-public.status to "completed"
   - Set each subtask to "completed" as you finish them
   - Set tasks.37-web-public.completed_at to current ISO timestamp
   - Add any important notes to tasks.37-web-public.notes
6. Finally, create a git commit with message: "feat: implement 37-web-public — Web App — Public Layout, Landing Page, Vendor Search"

DO NOT skip any part of the task. Implement everything listed in the spec.
If you encounter a blocker, update progress.json notes field with the issue and set status to "failed".
