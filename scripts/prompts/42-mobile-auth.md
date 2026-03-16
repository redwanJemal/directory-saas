You are implementing task "Mobile Auth — Login, Register, Protected Navigation" for the Directory SaaS boilerplate project.

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
  - auth-screens: pending
  - protected-navigation: pending
  - tab-bar: pending
  - profile-screen: pending



## TASK SPECIFICATION

# Task 42: Mobile Auth — Login, Register, Protected Navigation

## Summary
Implement complete authentication screens (login, register, forgot password) with Zod validation, haptic feedback, animated transitions, and protected navigation. Set up the full tab navigation with 5 tabs: Home, Search, Bookings, Planner, Profile. All text uses i18n `t()`, all colors from theme.

## Current State
- Task 41 scaffolded the mobile app with Expo Router, NativeWind, i18n, Zustand auth store, and Axios client
- `store/auth-store.ts` has `login()`, `register()`, `logout()`, `initialize()` methods
- `lib/api.ts` has token refresh interceptor
- `(auth)` and `(main)` route groups exist with placeholders
- Backend auth endpoints: `POST /api/v1/auth/client/login`, `POST /api/v1/auth/client/register`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`
- Backend returns `{ accessToken, refreshToken, user }` wrapped in the standard envelope

## Required Changes

### 42.1 Navigation Structure

Update the route structure:

```
app/
├── _layout.tsx              # Root layout (providers, splash, auth init)
├── index.tsx                # Entry redirect (auth state check)
├── (auth)/                  # Public auth stack
│   ├── _layout.tsx          # Stack navigator
│   ├── login.tsx            # Login screen
│   ├── register.tsx         # Register screen
│   └── forgot-password.tsx  # Forgot password screen
└── (main)/                  # Protected tab navigator
    ├── _layout.tsx          # Tab navigator with 5 tabs
    ├── index.tsx            # Home / Dashboard
    ├── search.tsx           # Vendor Search
    ├── bookings.tsx         # My Bookings
    ├── planner.tsx          # Wedding Planner
    ├── profile.tsx          # Profile & Settings
    └── vendor/
        └── [id].tsx         # Vendor detail (stack push from search)
```

### 42.2 Auth Validation Schemas

Create `lib/auth-schemas.ts`:

```typescript
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('auth.emailRequired'),
  password: z.string().min(1, 'auth.passwordRequired'),
});
export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(2, 'auth.nameRequired'),
  email: z.string().email('auth.emailRequired'),
  password: z.string().min(8, 'auth.passwordMinLength'),
  confirmPassword: z.string(),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'auth.termsAgree' }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'auth.passwordsDoNotMatch',
  path: ['confirmPassword'],
});
export type RegisterFormData = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email('auth.emailRequired'),
});
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
```

### 42.3 Reusable Form Components

Create `components/ui/input.tsx`:

```typescript
import { TextInput, View, Text, type TextInputProps } from 'react-native';
import { forwardRef } from 'react';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <View className="mb-4">
        <Text className="mb-1.5 text-sm font-medium text-content">{label}</Text>
        <TextInput
          ref={ref}
          className={`rounded-input border px-4 py-3 text-base text-content ${
            error ? 'border-danger-500' : 'border-border'
          } bg-surface`}
          placeholderTextColor="#868e96"
          {...props}
        />
        {error && (
          <Text className="mt-1 text-sm text-danger-500">{error}</Text>
        )}
      </View>
    );
  },
);
```

Create `components/ui/button.tsx`:

```typescript
import { Pressable, Text, ActivityIndicator, type PressableProps } from 'react-native';
import * as Haptics from 'expo-haptics';

interface ButtonProps extends PressableProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  loading?: boolean;
  haptic?: 'light' | 'medium' | 'heavy';
}

const variantStyles = {
  primary: { container: 'bg-brand-600', text: 'text-content-inverse' },
  secondary: { container: 'bg-surface-secondary', text: 'text-content' },
  outline: { container: 'border border-border bg-transparent', text: 'text-content' },
  danger: { container: 'bg-danger-500', text: 'text-content-inverse' },
};

export function Button({
  title,
  variant = 'primary',
  loading,
  haptic = 'light',
  onPress,
  disabled,
  ...props
}: ButtonProps) {
  const styles = variantStyles[variant];

  const handlePress = (e: any) => {
    if (haptic === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    else if (haptic === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    else if (haptic === 'heavy') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onPress?.(e);
  };

  return (
    <Pressable
      className={`rounded-button px-6 py-3.5 ${styles.container} ${
        (disabled || loading) ? 'opacity-50' : 'active:opacity-80'
      }`}
      disabled={disabled || loading}
      onPress={handlePress}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : '#4c6ef5'} />
      ) : (
        <Text className={`text-center text-base font-semibold ${styles.text}`}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
```

### 42.4 Login Screen

**app/(auth)/login.tsx:**

Full login screen with:
- App logo/branding from `lib/config.ts` (configurable name, not hardcoded)
- Email + password form fields using `Input` component
- Zod validation via `react-hook-form` + `@hookform/resolvers`
- Loading state with spinner on submit button
- Error display (from API or validation)
- Haptic feedback (medium) on submit
- "Forgot Password?" link → `/(auth)/forgot-password`
- "Don't have an account? Sign Up" link → `/(auth)/register`
- All text via `t()` from `react-i18next`
- All colors via NativeWind theme classes (bg-surface, text-content, bg-brand-600, etc.)
- On success: store tokens, navigate to `/(main)`
- KeyboardAvoidingView for proper keyboard handling
- SafeAreaView for notch/status bar

```typescript
// Key implementation pattern:
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '@/lib/auth-schemas';
import { useAuthStore } from '@/store/auth-store';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

// In component:
const { t } = useTranslation();
const { login, error, clearError } = useAuthStore();
const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
  resolver: zodResolver(loginSchema),
});

const onSubmit = async (data: LoginFormData) => {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  try {
    await login(data.email, data.password);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/(main)');
  } catch {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }
};
```

### 42.5 Register Screen

**app/(auth)/register.tsx:**

Register screen with:
- App branding header (configurable)
- Name, email, password, confirm password fields with Zod validation
- Terms of service checkbox
- Submit with haptic feedback
- Error display
- "Already have an account? Sign In" link
- On success: store tokens, navigate to `/(main)`
- Calls `POST /api/v1/auth/client/register` with `{ name, email, password }`
- ScrollView for long form
- All text via `t()`, all colors via theme

### 42.6 Forgot Password Screen

**app/(auth)/forgot-password.tsx:**

- Email input with Zod validation
- "Send Reset Link" button
- Success message after submission
- Back to login link
- Calls `POST /api/v1/auth/forgot-password` (if endpoint exists, otherwise show "feature coming soon")
- All text via `t()`, all colors via theme

### 42.7 Protected Tab Navigation

**app/(main)/_layout.tsx:**

Update to 5 tabs with custom styling:

```typescript
import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth-store';

export default function MainLayout() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthStore();

  // Protected: redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4c6ef5',  // brand-600
        tabBarInactiveTintColor: '#868e96', // content-tertiary
        tabBarStyle: {
          backgroundColor: '#ffffff',       // surface
          borderTopColor: '#dee2e6',        // border
          borderTopWidth: 1,
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: t('tabs.search'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: t('tabs.bookings'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          title: t('tabs.planner'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="clipboard-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

### 42.8 Profile Screen with Settings

**app/(main)/profile.tsx:**

Full profile screen with:
- User info section: avatar placeholder, name, email
- "Edit Profile" button
- Settings section:
  - Language switcher (English / Amharic) with `i18n.changeLanguage()`
  - Notifications toggle (placeholder)
- About section: app version from `expo-constants`
- Logout button with confirmation alert
- Haptic feedback on logout (heavy)
- All text via `t()`, all colors from theme

```typescript
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';

const handleLogout = () => {
  Alert.alert(t('auth.logout'), t('profile.logoutConfirm'), [
    { text: t('common.cancel'), style: 'cancel' },
    {
      text: t('auth.logout'),
      style: 'destructive',
      onPress: async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        await logout();
        router.replace('/(auth)/login');
      },
    },
  ]);
};
```

### 42.9 Placeholder Tab Screens

Create placeholder implementations for tabs that will be built in later tasks:

**app/(main)/bookings.tsx** — Shows "No bookings yet" empty state with "Find Vendors" button linking to search tab.

**app/(main)/planner.tsx** — Shows "Set up your wedding to access planning tools" message or placeholder.

### 42.10 Animated Transitions

In the root `_layout.tsx`, configure animation between auth and main stacks:

```typescript
<Stack
  screenOptions={{
    headerShown: false,
    animation: 'fade',  // Smooth transition between auth ↔ main
  }}
>
  <Stack.Screen name="(auth)" options={{ animation: 'slide_from_bottom' }} />
  <Stack.Screen name="(main)" options={{ animation: 'fade' }} />
</Stack>
```

## Acceptance Criteria
- [ ] Login screen renders with email + password fields, all text localized
- [ ] Login form validates with Zod (email format, password required)
- [ ] Login calls `POST /api/v1/auth/client/login` with real API
- [ ] Tokens stored in SecureStore (localStorage on web) after login
- [ ] Register screen with name, email, password, confirm password, terms checkbox
- [ ] Register validates with Zod (password match, min length, terms)
- [ ] Register calls `POST /api/v1/auth/client/register`
- [ ] Forgot password screen with email input
- [ ] Auth error messages display from API response
- [ ] Haptic feedback on submit (medium), success (notification), error (notification)
- [ ] Auto-login works: app start → check token → `/auth/me` → navigate to main
- [ ] Protected navigation: `(main)` redirects to login when not authenticated
- [ ] Tab bar shows 5 tabs: Home, Search, Bookings, Planner, Profile
- [ ] Tab bar uses brand colors from theme
- [ ] Profile screen shows user info, language switcher, logout
- [ ] Language toggle switches all text between English and Amharic
- [ ] Logout clears tokens, redirects to login
- [ ] Animated transitions between auth and main stacks
- [ ] No hardcoded text — all strings via `t()`
- [ ] No hardcoded colors in component files — all via NativeWind theme classes
- [ ] TypeScript compiles with 0 errors

## Files to Create/Modify
- `apps/mobile/lib/auth-schemas.ts` (create)
- `apps/mobile/components/ui/input.tsx` (create)
- `apps/mobile/components/ui/button.tsx` (create)
- `apps/mobile/app/(auth)/login.tsx` (rewrite)
- `apps/mobile/app/(auth)/register.tsx` (create)
- `apps/mobile/app/(auth)/forgot-password.tsx` (create)
- `apps/mobile/app/(main)/_layout.tsx` (rewrite — 5 tabs + auth guard)
- `apps/mobile/app/(main)/index.tsx` (update)
- `apps/mobile/app/(main)/search.tsx` (update placeholder)
- `apps/mobile/app/(main)/bookings.tsx` (create)
- `apps/mobile/app/(main)/planner.tsx` (create)
- `apps/mobile/app/(main)/profile.tsx` (rewrite)
- `apps/mobile/app/_layout.tsx` (update transitions)
- `apps/mobile/i18n/en.json` (update if needed)
- `apps/mobile/i18n/am.json` (update if needed)

## Dependencies
- Task 41: Mobile App Scaffolding

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
   - Set tasks.42-mobile-auth.status to "completed"
   - Set each subtask to "completed" as you finish them
   - Set tasks.42-mobile-auth.completed_at to current ISO timestamp
   - Add any important notes to tasks.42-mobile-auth.notes
6. Finally, create a git commit with message: "feat: implement 42-mobile-auth — Mobile Auth — Login, Register, Protected Navigation"

DO NOT skip any part of the task. Implement everything listed in the spec.
If you encounter a blocker, update progress.json notes field with the issue and set status to "failed".
