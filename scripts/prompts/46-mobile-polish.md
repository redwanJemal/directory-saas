You are implementing task "Mobile Polish — Animations, Haptics, Notifications, Build Config" for the Directory SaaS boilerplate project.

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
  - animations: pending
  - haptics: pending
  - notifications: pending
  - offline-support: pending
  - error-handling: pending
  - build-config: pending



## TASK SPECIFICATION

# Task 46: Mobile Polish — Animations, Haptics, Notifications, Build Config

## Summary
Polish the mobile app for production readiness: add smooth animations throughout, standardize haptic feedback, implement push notifications with deep linking, add offline support with TanStack Query persistence, create global error handling, and configure production build settings with EAS.

## Current State
- Tasks 41-45 built the full mobile app: auth, search, dashboard, planning tools, messaging
- react-native-reanimated is installed but animations are minimal
- expo-haptics is used in some places but not consistently
- expo-notifications is installed but not configured
- No offline support
- No global error boundary
- EAS config exists but is basic
- App icon and splash screen are placeholders

## Required Changes

### 46.1 Animation System

Create `lib/animations.ts` with reusable animation presets:

```typescript
import {
  withSpring,
  withTiming,
  withDelay,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  FadeInDown,
  FadeInUp,
  Layout,
  type AnimationCallback,
} from 'react-native-reanimated';

// Spring configs
export const springConfig = {
  gentle: { damping: 20, stiffness: 150 },
  bouncy: { damping: 12, stiffness: 200 },
  stiff: { damping: 25, stiffness: 300 },
};

// Entering animations for list items (staggered)
export const staggeredFadeIn = (index: number) =>
  FadeInDown.delay(index * 60).springify().damping(18).stiffness(150);

// Screen transition presets
export const screenTransitions = {
  fadeIn: FadeIn.duration(200),
  fadeOut: FadeOut.duration(150),
  slideIn: SlideInRight.springify().damping(20),
  slideOut: SlideOutLeft.duration(200),
};

// Layout animation for list reordering
export const listLayout = Layout.springify().damping(18).stiffness(150);
```

**Apply animations throughout the app:**

1. **List item enter animations** — All FlatLists should use staggered fade-in:
   ```typescript
   import Animated from 'react-native-reanimated';
   import { staggeredFadeIn } from '@/lib/animations';

   // In FlatList renderItem:
   const renderItem = ({ item, index }: { item: T; index: number }) => (
     <Animated.View entering={staggeredFadeIn(index)}>
       <ItemComponent item={item} />
     </Animated.View>
   );
   ```

2. **Screen transitions** — Configure in Stack and Tab navigators:
   ```typescript
   // Stack screens
   <Stack.Screen
     options={{
       animation: 'slide_from_right',
       animationDuration: 250,
     }}
   />
   ```

3. **Pull-to-refresh spring** — Custom pull-to-refresh indicator:
   ```typescript
   // Use Reanimated shared value for pull distance
   // Spring animation on release
   const pullDistance = useSharedValue(0);
   const animatedStyle = useAnimatedStyle(() => ({
     transform: [{ translateY: withSpring(pullDistance.value, springConfig.gentle) }],
   }));
   ```

4. **Skeleton shimmer** — Enhance the existing Skeleton component:
   ```typescript
   // In components/skeleton.tsx, add shimmer effect:
   import { LinearGradient } from 'expo-linear-gradient';

   // Animated gradient that moves across the skeleton
   const translateX = useSharedValue(-width);
   useEffect(() => {
     translateX.value = withRepeat(
       withTiming(width, { duration: 1200 }),
       -1,
       false,
     );
   }, []);
   ```

5. **Tab bar icon animation** — Bounce on select:
   ```typescript
   // Custom tab bar icon wrapper
   function AnimatedTabIcon({ focused, children }: { focused: boolean; children: React.ReactNode }) {
     const scale = useSharedValue(1);

     useEffect(() => {
       if (focused) {
         scale.value = withSpring(1.15, springConfig.bouncy);
         setTimeout(() => {
           scale.value = withSpring(1, springConfig.gentle);
         }, 100);
       }
     }, [focused]);

     const animatedStyle = useAnimatedStyle(() => ({
       transform: [{ scale: scale.value }],
     }));

     return <Animated.View style={animatedStyle}>{children}</Animated.View>;
   }
   ```

6. **Countdown card** — Animated number change:
   ```typescript
   // Smooth number transition when days change
   // Use Reanimated shared value with withTiming for digit flip effect
   ```

7. **Bottom sheet animations** — All bottom sheets should slide up with spring:
   ```typescript
   // Wrap modal content in Animated.View with entering/exiting:
   entering={FadeInUp.springify().damping(20)}
   exiting={FadeOut.duration(150)}
   ```

8. **Button press animation** — Scale down on press:
   ```typescript
   // In components/ui/button.tsx, add:
   const scale = useSharedValue(1);
   const animatedStyle = useAnimatedStyle(() => ({
     transform: [{ scale: scale.value }],
   }));

   // onPressIn: scale to 0.97
   // onPressOut: spring back to 1
   ```

### 46.2 Haptic Feedback Standardization

Create `lib/haptics.ts`:

```typescript
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// No-op on web
const isNative = Platform.OS !== 'web';

export const haptics = {
  /** Light tap — button presses, tab switches, chip selections */
  light: () => {
    if (isNative) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },

  /** Medium tap — form submit, swipe actions, important interactions */
  medium: () => {
    if (isNative) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },

  /** Heavy tap — destructive actions (delete, cancel, logout) */
  heavy: () => {
    if (isNative) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },

  /** Success — booking confirmed, task completed, save successful */
  success: () => {
    if (isNative) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },

  /** Warning — validation error, rate limit */
  warning: () => {
    if (isNative) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },

  /** Error — login failed, API error, network error */
  error: () => {
    if (isNative) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },

  /** Selection tick — checkbox, radio, toggle */
  selection: () => {
    if (isNative) Haptics.selectionAsync();
  },
};
```

**Audit and update all interactive elements:**

| Interaction | Haptic Type |
|---|---|
| Button press (default) | `haptics.light` |
| Form submit | `haptics.medium` |
| Login/Register submit | `haptics.medium` |
| Login success | `haptics.success` |
| Login failure | `haptics.error` |
| Tab switch | `haptics.light` |
| Checkbox toggle | `haptics.selection` |
| Task completed | `haptics.success` |
| Swipe action trigger | `haptics.medium` |
| Delete action | `haptics.heavy` |
| Booking accept | `haptics.success` |
| Booking decline | `haptics.heavy` |
| Message sent | `haptics.light` |
| Pull-to-refresh trigger | `haptics.light` |
| Inquiry submitted | `haptics.success` |
| Logout | `haptics.heavy` |
| Filter applied | `haptics.light` |
| Language changed | `haptics.selection` |
| Error displayed | `haptics.warning` |

Update the `Button` component and all screens to use `haptics.*` instead of raw `Haptics.*` calls.

### 46.3 Push Notifications

Create `lib/notifications.ts`:

```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { api } from './api';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  // Get Expo push token
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
  });

  // Register token with backend
  try {
    await api.post('/notifications/register-device', {
      token: tokenData.data,
      platform: Platform.OS,
    });
  } catch (error) {
    console.error('Failed to register push token:', error);
  }

  // Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  return tokenData.data;
}

// Handle notification tap — deep link to relevant screen
export function setupNotificationListeners() {
  // When user taps a notification
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const data = response.notification.request.content.data;

      switch (data?.type) {
        case 'new_message':
          router.push(`/(main)/chat/${data.conversationId}`);
          break;
        case 'booking_update':
          router.push(`/(main)/booking/${data.bookingId}`);
          break;
        case 'rsvp_update':
          // Navigate to guest list in planner
          router.push('/(main)/planner');
          break;
        case 'task_reminder':
          router.push('/(main)/planner');
          break;
        default:
          router.push('/(main)');
      }
    },
  );

  return subscription;
}
```

**Integration in root layout (app/_layout.tsx):**

```typescript
import { registerForPushNotifications, setupNotificationListeners } from '@/lib/notifications';

useEffect(() => {
  // Register for push notifications after auth
  if (isAuthenticated) {
    registerForPushNotifications();
  }

  // Set up notification tap listener
  const subscription = setupNotificationListeners();
  return () => subscription.remove();
}, [isAuthenticated]);
```

### 46.4 Offline Support

**TanStack Query persistence with AsyncStorage:**

Install: `@react-native-async-storage/async-storage`

Add to `apps/mobile/package.json`:
```json
{
  "dependencies": {
    "@react-native-async-storage/async-storage": "^2.1.2"
  }
}
```

Create `lib/query-persistence.ts`:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  type PersistedClient,
  type Persister,
} from '@tanstack/react-query-persist-client';

const CACHE_KEY = 'REACT_QUERY_CACHE';

export const asyncStoragePersister: Persister = {
  persistClient: async (client: PersistedClient) => {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(client));
  },
  restoreClient: async () => {
    const cache = await AsyncStorage.getItem(CACHE_KEY);
    return cache ? JSON.parse(cache) : undefined;
  },
  removeClient: async () => {
    await AsyncStorage.removeItem(CACHE_KEY);
  },
};
```

**Update root layout to use PersistQueryClientProvider:**

```typescript
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { asyncStoragePersister } from '@/lib/query-persistence';

// Replace QueryClientProvider with:
<PersistQueryClientProvider
  client={queryClient}
  persistOptions={{
    persister: asyncStoragePersister,
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
  }}
>
  {children}
</PersistQueryClientProvider>
```

Also add `@tanstack/react-query-persist-client` to dependencies.

**Offline banner component:**

Create `components/offline-banner.tsx`:

```typescript
import { View, Text } from 'react-native';
import { useEffect, useState } from 'react';
import { NetInfo } from '@react-native-community/netinfo'; // or use expo approach
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

export function OfflineBanner() {
  const { t } = useTranslation();
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Use fetch-based connectivity check or NetInfo
    const checkConnectivity = async () => {
      try {
        await fetch(process.env.EXPO_PUBLIC_API_URL + '/health', {
          method: 'HEAD',
          cache: 'no-store',
        });
        setIsOffline(false);
      } catch {
        setIsOffline(true);
      }
    };

    const interval = setInterval(checkConnectivity, 10000);
    checkConnectivity();
    return () => clearInterval(interval);
  }, []);

  if (!isOffline) return null;

  return (
    <Animated.View
      entering={FadeInDown}
      exiting={FadeOutUp}
      className="flex-row items-center justify-center bg-warning-500 px-4 py-2"
    >
      <Ionicons name="cloud-offline-outline" size={16} color="#fff" />
      <Text className="ml-2 text-sm font-medium text-content-inverse">
        {t('common.offline')}
      </Text>
    </Animated.View>
  );
}
```

Add `<OfflineBanner />` in the root layout above the Stack navigator.

### 46.5 Global Error Handling

Create `components/error-boundary.tsx`:

```typescript
import { Component, type ReactNode } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import i18n from '@/i18n';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <View className="flex-1 items-center justify-center bg-surface px-8">
          <Ionicons name="warning-outline" size={64} color="#fa5252" />
          <Text className="mt-4 text-center text-lg font-semibold text-content">
            {i18n.t('common.error')}
          </Text>
          <Text className="mt-2 text-center text-sm text-content-secondary">
            {this.state.error?.message || ''}
          </Text>
          <Pressable
            className="mt-6 rounded-button bg-brand-600 px-6 py-3"
            onPress={this.resetError}
          >
            <Text className="font-semibold text-content-inverse">
              {i18n.t('common.retry')}
            </Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}
```

Create `lib/error-handler.ts` for API error toast/display:

```typescript
import { Alert, Platform } from 'react-native';
import i18n from '@/i18n';
import { haptics } from './haptics';

export function handleApiError(error: any) {
  const status = error?.response?.status;
  const message = error?.response?.data?.error?.message;

  let userMessage: string;

  switch (status) {
    case 401:
      userMessage = i18n.t('errors.unauthorized');
      break;
    case 403:
      userMessage = i18n.t('errors.forbidden');
      break;
    case 404:
      userMessage = i18n.t('errors.notFound');
      break;
    case 422:
      userMessage = message || i18n.t('errors.validationError');
      break;
    case 429:
      userMessage = i18n.t('errors.rateLimited');
      haptics.warning();
      break;
    default:
      if (!error?.response) {
        userMessage = i18n.t('errors.networkError');
      } else {
        userMessage = i18n.t('errors.serverError');
      }
      haptics.error();
  }

  if (Platform.OS === 'web') {
    // Use console or toast on web
    console.error(userMessage);
  } else {
    Alert.alert(i18n.t('common.error'), userMessage);
  }

  return userMessage;
}
```

Wrap the app in `ErrorBoundary` in the root layout.

### 46.6 App Configuration & Build

**Update app.json → app.config.ts** for dynamic configuration:

```typescript
// apps/mobile/app.config.ts
import { type ExpoConfig, type ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: process.env.EXPO_PUBLIC_APP_NAME || 'Directory SaaS',
  slug: 'directory-saas',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'directory-saas',
  userInterfaceStyle: 'automatic',
  newArchEnabled: false,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#4c6ef5',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: process.env.EXPO_PUBLIC_IOS_BUNDLE_ID || 'com.directory.saas',
    infoPlist: {
      NSCameraUsageDescription: 'Camera access is needed to scan QR codes',
      NSLocationWhenInUseUsageDescription: 'Location access helps find nearby vendors',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#4c6ef5',
    },
    package: process.env.EXPO_PUBLIC_ANDROID_PACKAGE || 'com.directory.saas',
    permissions: [
      'CAMERA',
      'VIBRATE',
      'RECEIVE_BOOT_COMPLETED',
      'ACCESS_FINE_LOCATION',
    ],
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-localization',
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#4c6ef5',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    },
  },
});
```

**Update eas.json** with proper build profiles:

```json
{
  "cli": {
    "version": ">= 15.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_API_URL": "http://localhost:3333/api/v1"
      },
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.example.com/api/v1"
      },
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.example.com/api/v1"
      },
      "android": {
        "buildType": "app-bundle"
      },
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

**Update .env.example:**

```env
# API connection
EXPO_PUBLIC_API_URL=http://localhost:3333/api/v1

# App branding
EXPO_PUBLIC_APP_NAME=Directory SaaS
EXPO_PUBLIC_APP_SHORT_NAME=DS
EXPO_PUBLIC_SUPPORT_EMAIL=support@example.com

# EAS Build
EXPO_PUBLIC_PROJECT_ID=your-eas-project-id

# Platform identifiers (for white-labeling)
EXPO_PUBLIC_IOS_BUNDLE_ID=com.directory.saas
EXPO_PUBLIC_ANDROID_PACKAGE=com.directory.saas
```

**Update package.json scripts:**

```json
{
  "scripts": {
    "start": "expo start",
    "dev": "expo start --dev-client",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "lint": "eslint . --ext .ts,.tsx",
    "typecheck": "tsc --noEmit",
    "build:android-preview": "eas build -p android --profile preview",
    "build:ios-preview": "eas build -p ios --profile preview",
    "build:android-prod": "eas build -p android --profile production",
    "build:ios-prod": "eas build -p ios --profile production"
  }
}
```

### 46.7 Translation Updates

Review all components from tasks 41-46 and ensure every user-facing string uses `t()`. Update `i18n/en.json` and `i18n/am.json` with any new keys added by this task:

```json
{
  "notifications": {
    "permissionTitle": "Enable Notifications",
    "permissionMessage": "Get updates about messages, bookings, and reminders",
    "enable": "Enable",
    "later": "Later"
  }
}
```

Add corresponding Amharic translations.

## Acceptance Criteria
- [ ] List items animate in with staggered fade-in
- [ ] Screen transitions use slide/fade animations
- [ ] Bottom sheets slide up with spring animation
- [ ] Skeleton loading has shimmer effect
- [ ] Tab bar icons bounce on select
- [ ] Button press has scale-down animation
- [ ] Pull-to-refresh has spring animation
- [ ] Haptic feedback on all button taps (light)
- [ ] Haptic feedback on form submit (medium)
- [ ] Haptic feedback on destructive actions (heavy)
- [ ] Haptic feedback on success (success notification)
- [ ] Haptic feedback on errors (error notification)
- [ ] Haptic feedback on checkbox/toggle (selection)
- [ ] Push notification permission requested on first login
- [ ] Device token registered with backend
- [ ] Notification tap navigates to correct screen (deep link)
- [ ] TanStack Query cache persisted to AsyncStorage
- [ ] Offline banner shows when network unavailable
- [ ] Offline banner hides when connection restored
- [ ] Cached data available when offline
- [ ] Global error boundary catches rendering errors
- [ ] API errors show appropriate localized messages
- [ ] Network errors show "check your connection" message
- [ ] app.config.ts supports dynamic configuration via env vars
- [ ] eas.json has development, preview, production profiles
- [ ] Build scripts in package.json for preview and production
- [ ] App icon and splash screen are configurable (not hardcoded product)
- [ ] All new strings added to en.json and am.json
- [ ] TypeScript compiles with 0 errors
- [ ] App builds for web (`expo start --web`)

## Files to Create/Modify
- `apps/mobile/lib/animations.ts` (create)
- `apps/mobile/lib/haptics.ts` (create)
- `apps/mobile/lib/notifications.ts` (create)
- `apps/mobile/lib/query-persistence.ts` (create)
- `apps/mobile/lib/error-handler.ts` (create)
- `apps/mobile/components/error-boundary.tsx` (create)
- `apps/mobile/components/offline-banner.tsx` (create)
- `apps/mobile/app.config.ts` (create — replaces app.json)
- `apps/mobile/eas.json` (update)
- `apps/mobile/.env.example` (update)
- `apps/mobile/package.json` (update — add async-storage, persist-client)
- `apps/mobile/app/_layout.tsx` (update — error boundary, offline banner, persistence, notifications)
- `apps/mobile/app/(main)/_layout.tsx` (update — animated tab icons)
- `apps/mobile/components/ui/button.tsx` (update — press animation, haptics.ts import)
- `apps/mobile/components/skeleton.tsx` (update — shimmer effect)
- `apps/mobile/components/planner/checklist-view.tsx` (update — animations)
- `apps/mobile/components/planner/guest-list-view.tsx` (update — animations)
- `apps/mobile/i18n/en.json` (update)
- `apps/mobile/i18n/am.json` (update)

## Dependencies
- Task 41: Mobile App Scaffolding
- Task 42: Mobile Auth
- Task 43: Mobile Search
- Task 44: Mobile Dashboard
- Task 45: Mobile Planning Tools

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
   - Set tasks.46-mobile-polish.status to "completed"
   - Set each subtask to "completed" as you finish them
   - Set tasks.46-mobile-polish.completed_at to current ISO timestamp
   - Add any important notes to tasks.46-mobile-polish.notes
6. Finally, create a git commit with message: "feat: implement 46-mobile-polish — Mobile Polish — Animations, Haptics, Notifications, Build Config"

DO NOT skip any part of the task. Implement everything listed in the spec.
If you encounter a blocker, update progress.json notes field with the issue and set status to "failed".
