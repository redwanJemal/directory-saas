You are implementing task "Provider Portal — Bookings, Reviews, Team, Messages, Calendar" for the Directory SaaS boilerplate project.

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
  - bookings-page: pending
  - reviews-page: pending
  - team-page: pending
  - messages-page: pending
  - calendar-page: pending
  - analytics-page: pending
  - settings-page: pending



## TASK SPECIFICATION

# Task 36: Provider Portal — Bookings, Reviews, Team, Messages, Calendar, Analytics, Settings Pages

## Summary
Build all remaining provider portal pages: Bookings management with status workflow, Reviews with responses, Team member management, Messages (conversation threads), Calendar view, Analytics dashboard, and Settings. These complete the provider portal's feature set.

## Current State
- Provider portal has layout (Task 34), profile and portfolio pages (Task 35)
- Remaining nav items show placeholder pages
- Backend endpoints available for tenant-scoped resources:
  - Bookings: `GET /api/v1/bookings`, `GET /api/v1/bookings/:id`, `PATCH /api/v1/bookings/:id/status`, `POST /api/v1/bookings/:id/quote`
  - Reviews: `GET /api/v1/reviews`, `POST /api/v1/reviews/:id/response`
  - Team: `GET /api/v1/tenants/me/users`, `POST /api/v1/tenants/me/users/invite`, `PATCH /api/v1/tenants/me/users/:id/role`, `DELETE /api/v1/tenants/me/users/:id`
  - Messages: `GET /api/v1/conversations`, `GET /api/v1/conversations/:id/messages`, `POST /api/v1/conversations/:id/messages`
  - Notifications: `GET /api/v1/notifications`
- Data table component exists in admin app but needs to be replicated for provider portal (or shared)

## Required Changes

### 36.1 Install Dependencies

```bash
cd apps/provider-portal && npm install @tanstack/react-table date-fns recharts
```

### 36.2 Replicate Data Table Component

Copy the data table component from admin to provider-portal:

```
apps/provider-portal/src/components/data-table/
├── data-table.tsx
├── data-table-pagination.tsx
├── data-table-toolbar.tsx
├── data-table-row-actions.tsx
├── data-table-column-header.tsx
└── index.ts
```

Also copy `apps/provider-portal/src/components/status-badge.tsx` from admin app.

These should be identical implementations. (Task 39 will later extract these into truly shared components.)

### 36.3 Bookings Page

Create `apps/provider-portal/src/features/bookings/`:
```
features/bookings/
├── bookings-page.tsx
├── types.ts
├── schemas.ts
├── hooks/
│   └── use-bookings.ts
└── components/
    ├── booking-detail-sheet.tsx
    ├── send-quote-dialog.tsx
    └── update-status-dialog.tsx
```

**BookingsPage**:
- Tabs across top: All, Inquiries, Active, Completed, Cancelled
- Each tab filters the data table by status
- Data table columns: Couple Name, Event Date (formatted), Status (colored badge), Package Name, Amount (formatted currency), Actions dropdown
- Actions per status:
  - inquiry: View, Send Quote
  - quoted: View
  - booked: View, Mark Active
  - active: View, Mark Complete
  - completed: View
  - cancelled: View
- Search by couple name

**Booking status flow** (state machine):
```
inquiry → quoted → booked → active → completed
                                   → cancelled
inquiry → cancelled
quoted → cancelled
```

**Status badge colors**:
- inquiry: blue
- quoted: yellow
- booked: indigo
- active: green
- completed: gray
- cancelled: red

**BookingDetailSheet** — slide-out with full details:
- Couple info (name, email, phone)
- Event details (date, venue, guest count)
- Package selected
- Quote amount + breakdown
- Status history timeline
- Messages/notes

**SendQuoteDialog**:
- Form: amount (number), description (textarea), valid until (date), notes
- Zod validation
- Submit calls `POST /api/v1/bookings/:id/quote`

**UpdateStatusDialog**:
- Confirmation dialog with next status shown
- Optional notes field
- Submit calls `PATCH /api/v1/bookings/:id/status`

### 36.4 Reviews Page

Create `apps/provider-portal/src/features/reviews/`:
```
features/reviews/
├── reviews-page.tsx
├── types.ts
├── hooks/
│   └── use-reviews.ts
└── components/
    ├── review-card.tsx
    ├── respond-dialog.tsx
    └── rating-summary.tsx
```

**ReviewsPage**:
- Rating summary card at top:
  - Average rating (large number + star display)
  - Total reviews count
  - Rating distribution bar chart (5 bars for 1-5 stars, showing count per rating)
- Filter by rating (all/5/4/3/2/1 stars)
- List of review cards (not data table — card layout is better for reviews)

**ReviewCard**:
- Star rating display (filled/empty stars using Lucide Star icon)
- Reviewer name + date
- Review text
- Photos (if any) — thumbnail gallery
- Provider response (if exists) — indented block below
- "Respond" button (if no response yet)

**RespondDialog**:
- Textarea for response
- Character count
- Submit calls `POST /api/v1/reviews/:id/response`

**RatingSummary**:
```typescript
function RatingSummary({ average, total, distribution }: RatingSummaryProps) {
  return (
    <Card>
      <CardContent className="flex gap-6 p-6">
        <div className="text-center">
          <div className="text-4xl font-bold">{average.toFixed(1)}</div>
          <StarRating rating={average} />
          <p className="text-sm text-muted-foreground">{t('reviews.totalReviews', { count: total })}</p>
        </div>
        <div className="flex-1 space-y-1">
          {[5, 4, 3, 2, 1].map((stars) => (
            <div key={stars} className="flex items-center gap-2">
              <span className="text-sm w-3">{stars}</span>
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 rounded-full"
                  style={{ width: `${(distribution[stars] / total) * 100}%` }}
                />
              </div>
              <span className="text-sm text-muted-foreground w-8">{distribution[stars]}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

### 36.5 Team Page

Create `apps/provider-portal/src/features/team/`:
```
features/team/
├── team-page.tsx
├── types.ts
├── schemas.ts
├── hooks/
│   └── use-team.ts
└── components/
    ├── invite-member-dialog.tsx
    ├── change-role-dialog.tsx
    └── remove-member-dialog.tsx
```

**TeamPage**:
- Data table with columns: Name, Email, Role (badge), Joined (relative date), Actions
- "Invite Member" button
- Actions: Change Role, Remove Member

**InviteMemberDialog**:
- Form: email, role (select from tenant roles)
- Zod validation
- Submit calls `POST /api/v1/tenants/me/users/invite`

**ChangeRoleDialog**:
- Current role displayed
- Role select dropdown
- Submit calls `PATCH /api/v1/tenants/me/users/:id/role`

**RemoveMemberDialog**:
- AlertDialog confirmation with member name
- Submit calls `DELETE /api/v1/tenants/me/users/:id`

### 36.6 Messages Page

Create `apps/provider-portal/src/features/messages/`:
```
features/messages/
├── messages-page.tsx
├── types.ts
├── hooks/
│   └── use-messages.ts
└── components/
    ├── conversation-list.tsx
    ├── message-thread.tsx
    └── message-input.tsx
```

**MessagesPage** — Split panel layout:
- Left panel (1/3 width on desktop, full width on mobile): conversation list
- Right panel (2/3 width on desktop): message thread
- Mobile: show conversation list by default, click to enter thread, back button to return

**ConversationList**:
- List of conversations sorted by last message time
- Each item shows: avatar, name, last message preview (truncated), timestamp, unread badge count
- Active conversation highlighted
- Search conversations by name

**MessageThread**:
- Header: recipient name + avatar
- Scrollable message list (newest at bottom)
- Each message: bubble (left for received, right for sent), text, timestamp
- Auto-scroll to bottom on new messages
- File attachments shown as clickable links/thumbnails

**MessageInput**:
- Textarea (auto-resize) + Send button
- Attach file button (opens file picker)
- Send on Enter (Shift+Enter for newline)
- Disabled while sending

**Polling for new messages**:
```typescript
const { data: messages } = useQuery({
  queryKey: ['messages', conversationId],
  queryFn: () => fetchMessages(conversationId),
  refetchInterval: 5000, // Poll every 5 seconds
});
```

### 36.7 Calendar Page

Create `apps/provider-portal/src/features/calendar/`:
```
features/calendar/
├── calendar-page.tsx
└── hooks/
    └── use-calendar.ts
```

**CalendarPage**:
- Full month calendar grid (reuse pattern from availability tab in Task 35, but larger)
- Events/bookings displayed on calendar dates:
  - Each day cell shows colored dots or small event cards
  - Booking: name + status color
  - Blocked: gray overlay
- Click date to see day detail (dialog or side panel):
  - List of bookings on that date
  - Quick block/unblock toggle
- Navigation: prev/next month, today button
- Legend: Available (green), Booked (blue), Blocked (gray)

### 36.8 Analytics Page

Create `apps/provider-portal/src/features/analytics/`:
```
features/analytics/
├── analytics-page.tsx
└── hooks/
    └── use-analytics.ts
```

**AnalyticsPage** — Dashboard with charts using recharts:
- Time period selector (7 days, 30 days, 90 days, 12 months)
- Cards row: Profile Views, Inquiries, Booking Rate, Revenue (with trend arrows)
- Profile Views chart (Line chart — views over time)
- Inquiry Trend chart (Bar chart — inquiries per week/month)
- Booking Conversion funnel (views → inquiries → quotes → bookings)
- Revenue chart (Bar chart — monthly revenue)

**Chart components using recharts**:
```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

function ProfileViewsChart({ data }: { data: Array<{ date: string; views: number }> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('analytics.profileViews')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="date" className="text-muted-foreground" />
            <YAxis className="text-muted-foreground" />
            <Tooltip />
            <Line type="monotone" dataKey="views" className="stroke-primary" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

If API endpoints for analytics don't exist yet, use placeholder data with a comment indicating which endpoint should provide the data.

### 36.9 Settings Page

Create `apps/provider-portal/src/features/settings/`:
```
features/settings/
├── settings-page.tsx
└── components/
    ├── notification-settings.tsx
    ├── business-hours.tsx
    └── account-settings.tsx
```

**SettingsPage** — Tabbed layout:

**Notification Preferences tab**:
- Toggle switches for: email on new inquiry, email on new review, email on new message, email on booking status change
- Save button

**Business Hours tab**:
- Day-of-week rows (Mon-Sun)
- Each row: checkbox (open/closed), start time select, end time select
- Save button

**Account Settings tab**:
- Change password form: current password, new password, confirm new password
- Delete account (dangerous action with confirmation)

### 36.10 Update i18n Translations

Add all new translation keys to `apps/provider-portal/src/i18n/en.json` and `am.json` for: bookings, reviews, team, messages, calendar, analytics, settings namespaces.

## Acceptance Criteria
- [ ] Bookings page: tabs filter by status, data table loads bookings, view details in Sheet
- [ ] Booking workflow: inquiry → send quote → booked → active → completed (status transitions work)
- [ ] Send quote dialog: form validates with Zod, submits to API, shows toast
- [ ] Reviews page: rating summary card with distribution, review cards with star display
- [ ] Review response: dialog submits response, response shown below review
- [ ] Team page: list members, invite new member (email + role), change role, remove member
- [ ] Messages page: conversation list with unread badges, message thread with bubbles, send messages
- [ ] Messages: polling for new messages every 5 seconds
- [ ] Calendar page: month view with bookings shown, click date for details, block/unblock dates
- [ ] Analytics page: stat cards, line/bar charts with recharts, time period selector
- [ ] Settings page: notification toggles, business hours grid, account settings
- [ ] All pages use TanStack Query hooks for data fetching
- [ ] All forms validate with Zod schemas
- [ ] All strings from i18n translation files
- [ ] All pages responsive on mobile
- [ ] Provider portal builds with 0 errors

## Files to Create/Modify
- `apps/provider-portal/src/components/data-table/*.tsx` (create — copy from admin)
- `apps/provider-portal/src/components/status-badge.tsx` (create — copy from admin)
- `apps/provider-portal/src/features/bookings/bookings-page.tsx` (replace)
- `apps/provider-portal/src/features/bookings/types.ts` (create)
- `apps/provider-portal/src/features/bookings/schemas.ts` (create)
- `apps/provider-portal/src/features/bookings/hooks/use-bookings.ts` (create)
- `apps/provider-portal/src/features/bookings/components/booking-detail-sheet.tsx` (create)
- `apps/provider-portal/src/features/bookings/components/send-quote-dialog.tsx` (create)
- `apps/provider-portal/src/features/bookings/components/update-status-dialog.tsx` (create)
- `apps/provider-portal/src/features/reviews/reviews-page.tsx` (replace)
- `apps/provider-portal/src/features/reviews/types.ts` (create)
- `apps/provider-portal/src/features/reviews/hooks/use-reviews.ts` (create)
- `apps/provider-portal/src/features/reviews/components/review-card.tsx` (create)
- `apps/provider-portal/src/features/reviews/components/respond-dialog.tsx` (create)
- `apps/provider-portal/src/features/reviews/components/rating-summary.tsx` (create)
- `apps/provider-portal/src/features/team/team-page.tsx` (replace)
- `apps/provider-portal/src/features/team/types.ts` (create)
- `apps/provider-portal/src/features/team/schemas.ts` (create)
- `apps/provider-portal/src/features/team/hooks/use-team.ts` (create)
- `apps/provider-portal/src/features/team/components/invite-member-dialog.tsx` (create)
- `apps/provider-portal/src/features/team/components/change-role-dialog.tsx` (create)
- `apps/provider-portal/src/features/team/components/remove-member-dialog.tsx` (create)
- `apps/provider-portal/src/features/messages/messages-page.tsx` (replace)
- `apps/provider-portal/src/features/messages/types.ts` (create)
- `apps/provider-portal/src/features/messages/hooks/use-messages.ts` (create)
- `apps/provider-portal/src/features/messages/components/conversation-list.tsx` (create)
- `apps/provider-portal/src/features/messages/components/message-thread.tsx` (create)
- `apps/provider-portal/src/features/messages/components/message-input.tsx` (create)
- `apps/provider-portal/src/features/calendar/calendar-page.tsx` (replace)
- `apps/provider-portal/src/features/calendar/hooks/use-calendar.ts` (create)
- `apps/provider-portal/src/features/analytics/analytics-page.tsx` (replace)
- `apps/provider-portal/src/features/analytics/hooks/use-analytics.ts` (create)
- `apps/provider-portal/src/features/settings/settings-page.tsx` (replace)
- `apps/provider-portal/src/features/settings/components/notification-settings.tsx` (create)
- `apps/provider-portal/src/features/settings/components/business-hours.tsx` (create)
- `apps/provider-portal/src/features/settings/components/account-settings.tsx` (create)
- `apps/provider-portal/src/i18n/en.json` (modify)
- `apps/provider-portal/src/i18n/am.json` (modify)

## Dependencies
- Task 28 (Frontend Shared Foundation) — shadcn/ui components
- Task 29 (Frontend i18n) — translation strings
- Task 30 (Frontend Auth) — auth store, API client
- Task 34 (Provider Layout) — DashboardLayout, sidebar, tenant context
- Task 35 (Provider Profile) — calendar grid pattern, file upload pattern

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
   - Set tasks.36-provider-pages.status to "completed"
   - Set each subtask to "completed" as you finish them
   - Set tasks.36-provider-pages.completed_at to current ISO timestamp
   - Add any important notes to tasks.36-provider-pages.notes
6. Finally, create a git commit with message: "feat: implement 36-provider-pages — Provider Portal — Bookings, Reviews, Team, Messages, Calendar"

DO NOT skip any part of the task. Implement everything listed in the spec.
If you encounter a blocker, update progress.json notes field with the issue and set status to "failed".
