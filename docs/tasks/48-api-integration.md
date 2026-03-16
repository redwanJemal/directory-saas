# Task 48: API Integration Verification — No Demo Data, Real Endpoints

## Summary
Audit all 4 frontend apps (admin, provider-portal, web, mobile) to ensure every page fetches data from real API endpoints with no hardcoded demo/mock data. Verify loading, empty, and error states on all pages. Verify auth flows for all 3 user types. Verify multi-tenancy isolation. Fix any issues found. Ensure all apps build with 0 TypeScript errors.

## Current State
- All 4 apps have been built across tasks 28-46
- Backend API is fully implemented with all endpoints
- Frontend apps use TanStack Query hooks to fetch data
- Some pages may still contain hardcoded placeholder data from initial development
- Auth flows exist but end-to-end verification needed
- Error handling exists but may not cover all HTTP status codes consistently

## Required Changes

### 48.1 Audit All Frontend Pages

Perform a systematic audit of every page in every app. For each page, verify:

1. **Data source**: Is it fetching from a real API endpoint? Or showing hardcoded arrays/objects?
2. **Loading state**: Does it show a skeleton/spinner while data loads?
3. **Empty state**: Does it show a meaningful message when API returns empty data?
4. **Error state**: Does it show an error message when API fails?
5. **Text**: Are all strings using `t()` (no hardcoded English text)?
6. **Colors**: Are all colors from theme (no hardcoded hex values)?

#### Admin App (`apps/admin/`) Pages to Audit:

| Page | Route | API Endpoint | Check |
|------|-------|--------------|-------|
| Dashboard | `/` | `GET /api/v1/admin/dashboard/stats` | Stats cards, charts |
| Tenants List | `/tenants` | `GET /api/v1/admin/tenants` | Data table, pagination, filters |
| Tenant Detail | `/tenants/:id` | `GET /api/v1/admin/tenants/:id` | Detail view, edit form |
| Create Tenant | `/tenants/new` | `POST /api/v1/admin/tenants` | Form submission |
| Users List | `/users` | `GET /api/v1/admin/users` | Data table |
| Roles List | `/roles` | `GET /api/v1/admin/roles` | List, permissions grid |
| Subscriptions | `/subscriptions` | `GET /api/v1/admin/subscription-plans` | Plans list, CRUD |
| Audit Logs | `/audit-logs` | `GET /api/v1/admin/audit-logs` | Data table with filters |
| Jobs Dashboard | `/jobs` | Bull Board at `/api/v1/admin/queues` | Queue stats |
| Settings | `/settings` | Various settings endpoints | Form fields |

#### Provider Portal (`apps/provider-portal/`) Pages to Audit:

| Page | Route | API Endpoint | Check |
|------|-------|--------------|-------|
| Dashboard | `/` | `GET /api/v1/providers/dashboard` | Stats, recent activity |
| Profile | `/profile` | `GET /api/v1/providers/profile` | Profile tabs, edit forms |
| Portfolio | `/profile/portfolio` | `GET /api/v1/providers/portfolio` | Image grid, upload |
| Packages | `/profile/packages` | `GET /api/v1/providers/packages` | Pricing cards, CRUD |
| Bookings | `/bookings` | `GET /api/v1/providers/bookings` | List with status filters |
| Booking Detail | `/bookings/:id` | `GET /api/v1/providers/bookings/:id` | Detail, status actions |
| Reviews | `/reviews` | `GET /api/v1/providers/reviews` | Review list, stats |
| Team | `/team` | `GET /api/v1/providers/team` | Team member list |
| Messages | `/messages` | `GET /api/v1/messages/conversations` | Conversation list, chat |
| Calendar | `/calendar` | `GET /api/v1/providers/availability` | Availability calendar |
| Analytics | `/analytics` | `GET /api/v1/providers/analytics` | Charts, metrics |

#### Web Client App (`apps/web/`) Pages to Audit:

| Page | Route | API Endpoint | Check |
|------|-------|--------------|-------|
| Landing Page | `/` | May have some static content (OK for landing) | Hero, features |
| Search | `/search` | `GET /api/v1/search` | Search results, filters |
| Vendor Profile | `/vendor/:slug` | `GET /api/v1/providers/:slug` | All sections |
| Categories | `/categories` | `GET /api/v1/categories` | Category grid |
| Login | `/login` | `POST /api/v1/auth/client/login` | Form submission |
| Register | `/register` | `POST /api/v1/auth/client/register` | Form submission |
| Dashboard | `/dashboard` | `GET /api/v1/wedding/stats` | Wedding stats |
| Guest List | `/dashboard/guests` | `GET /api/v1/wedding/guests` | CRUD |
| Budget | `/dashboard/budget` | `GET /api/v1/wedding/budget` | Budget tracking |
| Checklist | `/dashboard/checklist` | `GET /api/v1/wedding/checklist` | Task list |
| Bookings | `/dashboard/bookings` | `GET /api/v1/bookings` | Booking list |

#### Mobile App (`apps/mobile/`) Screens to Audit:

| Screen | Route | API Endpoint | Check |
|--------|-------|--------------|-------|
| Login | `/(auth)/login` | `POST /api/v1/auth/client/login` | Form submission |
| Register | `/(auth)/register` | `POST /api/v1/auth/client/register` | Form submission |
| Home | `/(main)/` | Multiple endpoints | Categories, featured, stats |
| Search | `/(main)/search` | `GET /api/v1/search` | Results, filters |
| Vendor Profile | `/(main)/vendor/[id]` | `GET /api/v1/providers/:id` | All sections |
| Bookings | `/(main)/bookings` | `GET /api/v1/bookings` | List with status |
| Booking Detail | `/(main)/booking/[id]` | `GET /api/v1/bookings/:id` | Detail, actions |
| Planner - Checklist | `/(main)/planner` | `GET /api/v1/wedding/checklist` | Task CRUD |
| Planner - Guests | `/(main)/planner` | `GET /api/v1/wedding/guests` | Guest CRUD |
| Planner - Budget | `/(main)/planner` | `GET /api/v1/wedding/budget` | Budget tracking |
| Chat | `/(main)/chat/[id]` | `GET /api/v1/messages/...` | Messages |
| Profile | `/(main)/profile` | `GET /api/v1/auth/me` | User info |

### 48.2 Fix Hardcoded Data

For any page found using hardcoded data, replace with TanStack Query hooks:

```typescript
// WRONG: Hardcoded data
const stats = [
  { label: 'Total Users', value: 1234 },
  { label: 'Active Tenants', value: 56 },
];

// RIGHT: Real API data
const { data: stats, isLoading, error } = useQuery({
  queryKey: ['admin', 'dashboard', 'stats'],
  queryFn: async () => {
    const response = await api.get('/admin/dashboard/stats');
    return response.data;
  },
});
```

Ensure every data-displaying component follows this pattern:

```typescript
function DataList() {
  const { t } = useTranslation();
  const { data, isLoading, error, refetch } = useMyData();

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <ErrorState
        message={t('common.error')}
        onRetry={refetch}
      />
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon="inbox-outline"
        title={t('mySection.noData')}
        subtitle={t('mySection.noDataHint')}
      />
    );
  }

  return <FlatList data={data} ... />;
}
```

### 48.3 Verify Auth Flows End-to-End

Test each auth flow against the real backend:

**Admin User Flow:**
1. Navigate to admin app (`admin.{domain}` or `localhost:3002`)
2. Login with admin credentials → `POST /api/v1/auth/admin/login`
3. Verify dashboard loads with real data
4. Navigate through all admin pages — each should show real data or proper empty state
5. Verify token refresh works (wait 15+ minutes or manually expire token)
6. Verify logout clears session

**Provider/Tenant User Flow:**
1. Navigate to provider portal (`{slug}.{domain}` or `localhost:3001`)
2. Verify tenant slug extracted from subdomain or entered manually
3. Login with tenant credentials → `POST /api/v1/auth/tenant/login` with `tenantSlug`
4. Verify dashboard loads with tenant-scoped data
5. Verify all provider pages show tenant-scoped data (not other tenants')
6. Verify profile edit updates via API

**Client User Flow:**
1. Navigate to web app (`app.{domain}` or `localhost:3000`)
2. Register new account → `POST /api/v1/auth/client/register`
3. Verify email received (check Mailpit in dev)
4. Login → `POST /api/v1/auth/client/login`
5. Search for vendors → results from Meilisearch
6. View vendor profile → all sections load
7. Submit inquiry → creates booking
8. Access wedding dashboard → create wedding if needed
9. Use planning tools (checklist, guests, budget)
10. Mobile: repeat steps 2-9 on mobile app

### 48.4 Verify Multi-Tenancy Isolation

- Provider portal sends `X-Tenant-ID` or `X-Tenant-Slug` header on ALL API requests
- Verify in browser DevTools Network tab that every request includes the tenant header
- Log in as two different tenants and verify each only sees their own data
- Verify that accessing another tenant's resources returns 403 or 404

### 48.5 Verify Error Handling

Test each HTTP error code and verify the frontend handles it correctly:

| Status | Scenario | Expected Frontend Behavior |
|--------|----------|---------------------------|
| 401 | Token expired | Token refresh → retry. If refresh fails → redirect to login |
| 403 | No permission | Show "Permission denied" message (localized) |
| 404 | Resource not found | Show "Not found" state (localized) |
| 422 | Validation error | Show field-level errors from API response |
| 429 | Rate limited | Show "Too many requests" message (localized) |
| 500 | Server error | Show generic "Something went wrong" with retry (localized) |
| Network error | No connection | Show "Check your connection" (localized) |

For each app, verify:
- 401 handling: Axios interceptor attempts token refresh, retries original request, or redirects to login
- 422 handling: Form components display validation errors from API `error.details` field
- Generic errors: Error boundary or error state component shows localized message

### 48.6 Verify Query Parameter Format

Ensure all frontend API calls use the backend's bracket notation for filters:

```typescript
// WRONG
api.get('/providers?status=active&rating_gte=4')

// RIGHT
api.get('/providers?filter[status]=active&filter[rating][gte]=4.0&sort=-rating&page=1&pageSize=20')
```

Check all TanStack Query hooks across all apps for correct query parameter format.

### 48.7 Build Verification

Run builds for all apps and fix any TypeScript errors:

```bash
# Backend
cd backend && npm run build     # Must pass with 0 errors

# Admin
cd apps/admin && npm run build  # Must pass with 0 errors

# Provider Portal
cd apps/provider-portal && npm run build  # Must pass with 0 errors

# Web
cd apps/web && npm run build    # Must pass with 0 errors

# Mobile
cd apps/mobile && npm run typecheck  # Must pass with 0 errors
```

Fix any errors found. Common issues to fix:
- Missing type imports
- `any` types that should be properly typed
- Unused imports
- Missing translation keys
- Props type mismatches

### 48.8 Integration Checklist

Create `docs/integration-checklist.md`:

A comprehensive checklist for manual verification:

```markdown
# Integration Verification Checklist

## Admin App
- [ ] Login → dashboard shows real stats
- [ ] Tenants page: list loads, create/edit/delete works
- [ ] Users page: list loads, CRUD works
- [ ] Roles page: list loads, permissions grid works
- [ ] Subscriptions: plans load, CRUD works
- [ ] Audit logs: data table loads with filters
- [ ] Jobs: Bull Board loads
- [ ] Settings: forms load and save
- [ ] Logout: clears session, redirects to login

## Provider Portal
- [ ] Tenant slug extracted from subdomain
- [ ] Login with tenant credentials
- [ ] Dashboard: stats load
- [ ] Profile: all tabs load and save
- [ ] Portfolio: images load, upload works
- [ ] Packages: list loads, CRUD works
- [ ] Bookings: list loads, status actions work
- [ ] Reviews: list loads
- [ ] Team: list loads, invite works
- [ ] Messages: conversations load, send works
- [ ] Analytics: charts render with real data

## Web Client App
- [ ] Landing page renders
- [ ] Register creates account
- [ ] Login authenticates
- [ ] Search returns real vendors from Meilisearch
- [ ] Vendor profile loads all sections
- [ ] Inquiry form submits
- [ ] Wedding dashboard loads stats
- [ ] Checklist CRUD works
- [ ] Guest list CRUD works
- [ ] Budget tracking works
- [ ] Bookings list loads

## Mobile App
- [ ] Login authenticates against real API
- [ ] Register creates account
- [ ] Auto-login on restart (SecureStore)
- [ ] Home: categories and featured vendors load
- [ ] Search: results from Meilisearch
- [ ] Vendor profile: all sections load
- [ ] Inquiry: submits to API
- [ ] Bookings: list loads, actions work
- [ ] Checklist: CRUD works
- [ ] Guest list: CRUD works
- [ ] Budget: tracking works
- [ ] Messages: send/receive works
- [ ] Profile: shows user info, language toggle works
- [ ] Offline banner appears when disconnected

## Cross-Cutting
- [ ] Token refresh works (15m expiry → auto-refresh)
- [ ] 401 → redirect to login (after refresh fails)
- [ ] 403 → permission denied message
- [ ] 404 → not found state
- [ ] 422 → validation errors on form fields
- [ ] 429 → rate limit message
- [ ] 500 → generic error with retry
- [ ] All text localized (en + am)
- [ ] All colors from theme (no hardcoded hex)
- [ ] No hardcoded demo data arrays
- [ ] Multi-tenant isolation verified
```

## Acceptance Criteria
- [ ] Every page in admin app fetches data from real API (no hardcoded arrays)
- [ ] Every page in provider portal fetches data from real API
- [ ] Every page in web client fetches data from real API
- [ ] Every screen in mobile app fetches data from real API
- [ ] All pages show loading state (skeleton/spinner) while fetching
- [ ] All pages show empty state when API returns empty
- [ ] All pages show error state when API fails
- [ ] All forms submit to real API endpoints
- [ ] Admin login → dashboard → all pages work with real data
- [ ] Provider login with tenant slug → scoped data visible
- [ ] Client register → login → wedding dashboard → search → booking works
- [ ] Token refresh works automatically on 401
- [ ] Multi-tenancy: provider portal sends tenant header on all requests
- [ ] Multi-tenancy: data isolated between tenants
- [ ] Error states display correctly for 401, 403, 404, 422, 429, 500
- [ ] Query parameters use bracket notation throughout
- [ ] `npm run build` passes with 0 errors in backend
- [ ] `npm run build` passes with 0 errors in admin app
- [ ] `npm run build` passes with 0 errors in provider-portal
- [ ] `npm run build` passes with 0 errors in web app
- [ ] `npm run typecheck` passes with 0 errors in mobile app
- [ ] Integration checklist document created at `docs/integration-checklist.md`
- [ ] No demo/mock data in any production code path

## Files to Create/Modify
- `docs/integration-checklist.md` (create)
- Various files across all 4 apps where hardcoded data is found (fix)
- Various hook files to fix query parameter format if needed
- Various components to add missing loading/empty/error states
- TypeScript fixes across all apps as needed

## Dependencies
- Tasks 01-27 (backend complete)
- Tasks 28-40 (web frontend apps complete)
- Tasks 41-46 (mobile app complete)
- Task 47: Production Deployment (for subdomain testing)
