# Integration Verification Checklist

Manual verification checklist for all frontend apps against the real backend API.

## Admin App (localhost:3002)

- [ ] Login with admin credentials (`POST /api/v1/auth/admin/login`)
- [ ] Dashboard shows real stats from API
- [ ] Tenants page: list loads, create/edit/suspend works
- [ ] Tenant detail: shows full info, edit form saves
- [ ] Users page: list loads with pagination, type filter works
- [ ] Roles page: list loads, permissions grid works, create/edit/delete
- [ ] Subscriptions: plans list loads, CRUD works
- [ ] Audit logs: data table loads, date/action/resource filters work
- [ ] Jobs: queue stats load, Bull Board link works
- [ ] Settings: platform settings form, system health shows real service status
- [ ] Logout: clears session, redirects to login

## Provider Portal (localhost:3001)

- [ ] Login with tenant credentials + tenant slug (`POST /api/v1/auth/tenant/login`)
- [ ] X-Tenant-ID header sent on every API request (verify in DevTools Network tab)
- [ ] Dashboard: stats load from API (bookings, inquiries, rating, revenue)
- [ ] Profile > General Info: loads and saves
- [ ] Profile > Packages: list loads, create/edit/delete works
- [ ] Profile > FAQs: list loads, CRUD works
- [ ] Profile > Availability: loads and saves
- [ ] Portfolio: images load, upload works
- [ ] Bookings: list loads with status filters, detail view works, status actions
- [ ] Reviews: list loads, rating summary shows, respond to review works
- [ ] Team: member list loads, invite works, role change works
- [ ] Messages: conversations load, send message works
- [ ] Calendar: availability calendar renders, block/unblock dates
- [ ] Analytics: charts render with data, period filter works
- [ ] Settings: notification prefs, business hours, account settings
- [ ] Logout: clears session and tenant context

## Web Client App (localhost:3000)

- [ ] Landing page renders (hero, categories from API, featured vendors from API)
- [ ] Register creates account (`POST /api/v1/auth/client/register`)
- [ ] Login authenticates (`POST /api/v1/auth/client/login`)
- [ ] Search returns real vendors (results, filters, sorting, pagination)
- [ ] Vendor profile loads all sections (info, portfolio, packages, reviews, FAQs)
- [ ] Inquiry form submits to API
- [ ] Categories page loads from API
- [ ] Wedding dashboard loads stats (vendors, guests, budget, tasks)
- [ ] Checklist: task CRUD works
- [ ] Guest list: CRUD works, filters, import CSV
- [ ] Budget: tracking works, category cards, charts
- [ ] Bookings list loads
- [ ] Messages: conversations load, send/receive works
- [ ] Settings: profile info, change password, delete account
- [ ] Logout: clears session, redirects to login

## Mobile App

- [ ] Login authenticates against real API (`POST /api/v1/auth/client/login`)
- [ ] Register creates account (`POST /api/v1/auth/client/register`)
- [ ] Auto-login on restart (SecureStore token persistence)
- [ ] Home: categories and featured vendors load from API
- [ ] Search: results from API, filters work
- [ ] Vendor profile: all sections load (info, portfolio, packages, reviews)
- [ ] Inquiry: submits to API
- [ ] Bookings: list loads, status actions work
- [ ] Planner > Checklist: CRUD works
- [ ] Planner > Guest list: CRUD works
- [ ] Planner > Budget: tracking works
- [ ] Planner > Messages: send/receive works
- [ ] Profile: shows user info, language toggle works
- [ ] Offline banner appears when disconnected

## Cross-Cutting Concerns

### Authentication
- [ ] Token refresh works (15m expiry, auto-refresh on 401)
- [ ] 401 after refresh failure redirects to login
- [ ] Admin login uses `/auth/admin/login`
- [ ] Provider login uses `/auth/tenant/login` with tenantSlug
- [ ] Client login uses `/auth/client/login`
- [ ] Client register uses `/auth/client/register`

### Multi-Tenancy
- [ ] Provider portal sends X-Tenant-ID header on ALL requests
- [ ] Tenant slug extracted from login form
- [ ] Two different tenants see only their own data
- [ ] Accessing another tenant's resources returns 403/404

### Error Handling
- [ ] 401 (Unauthorized) -> token refresh -> retry, or redirect to login
- [ ] 403 (Forbidden) -> permission denied message
- [ ] 404 (Not Found) -> not found state
- [ ] 422 (Validation) -> field-level errors on forms
- [ ] 429 (Rate Limit) -> rate limit message (mobile has dedicated handler)
- [ ] 500 (Server Error) -> generic error with retry button
- [ ] Network error -> connection error message

### Query Parameters
- [ ] All filters use bracket notation: `filter[status]=active`
- [ ] Operators use nested brackets: `filter[rating][gte]=4.0`
- [ ] Sort uses prefix notation: `sort=-rating,name`
- [ ] Pagination uses `page` and `pageSize`

### Localization
- [ ] All text uses `t()` from react-i18next (no hardcoded English)
- [ ] Language toggle switches between English and Amharic
- [ ] All translation keys exist in both en.json and am.json

### Theming
- [ ] All colors from CSS variables / theme tokens (no hardcoded hex in web apps)
- [ ] Mobile uses centralized color constants from `lib/colors.ts`
- [ ] Dark mode works on web apps via `.dark` class
- [ ] Changing `--brand-hue` rebrands the entire web app

### Data Integrity
- [ ] No hardcoded demo/mock data arrays in any page
- [ ] All pages show loading skeleton/spinner while fetching
- [ ] All pages show empty state when API returns empty data
- [ ] All pages show error state when API fails
- [ ] All forms submit to real API endpoints

### Build Verification
- [ ] `cd backend && npm run build` passes with 0 errors
- [ ] `cd apps/admin && npm run build` passes with 0 errors
- [ ] `cd apps/provider-portal && npm run build` passes with 0 errors
- [ ] `cd apps/web && npm run build` passes with 0 errors
- [ ] `cd apps/mobile && npx tsc --noEmit` passes with 0 errors
