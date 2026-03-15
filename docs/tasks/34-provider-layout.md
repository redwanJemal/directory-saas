# Task 34: Provider Portal — Layout, Navigation, Dashboard

## Summary
Build the provider portal app shell with sidebar layout, header with mobile drawer, tenant context resolution, and a dashboard page with provider-specific stats. Same layout pattern as the admin app but with provider-specific navigation and tenant-aware API calls.

## Current State
- Provider portal has shadcn/ui components (Task 28), i18n (Task 29), and auth (Task 30)
- Login flow works with tenant slug (POST /api/v1/auth/tenant/login)
- App.tsx has a basic placeholder with routing to `pages/Dashboard.tsx`
- No sidebar, no header, no real routing, no dashboard content
- No tenant context management
- Backend resolves tenant via: subdomain > X-Tenant-ID header > X-Tenant-Slug header > JWT tenantId

## Required Changes

### 34.1 Tenant Context Store

Create `apps/provider-portal/src/stores/tenant-store.ts`:

```typescript
import { create } from 'zustand';

interface TenantState {
  tenantId: string | null;
  tenantSlug: string | null;
  tenantName: string | null;
}

interface TenantActions {
  setTenant: (tenant: { id: string; slug: string; name: string }) => void;
  clearTenant: () => void;
}

const STORAGE_KEY = 'saas_provider_tenant';

export const useTenantStore = create<TenantState & TenantActions>((set) => {
  // Hydrate from localStorage
  let initial: Partial<TenantState> = {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) initial = JSON.parse(stored);
  } catch {}

  return {
    tenantId: null,
    tenantSlug: null,
    tenantName: null,
    ...initial,

    setTenant: (tenant) => {
      const state = { tenantId: tenant.id, tenantSlug: tenant.slug, tenantName: tenant.name };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      set(state);
    },

    clearTenant: () => {
      localStorage.removeItem(STORAGE_KEY);
      set({ tenantId: null, tenantSlug: null, tenantName: null });
    },
  };
});
```

### 34.2 Update API Client with Tenant Header

Update `apps/provider-portal/src/lib/api.ts` — add tenant header to all requests:

In the request interceptor, after attaching the auth token, also attach tenant context:

```typescript
api.interceptors.request.use((config) => {
  // Auth token
  if (getAuthStore) {
    const { token } = getAuthStore();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }

  // Tenant context
  if (getTenantStore) {
    const { tenantId } = getTenantStore();
    if (tenantId) config.headers['X-Tenant-ID'] = tenantId;
  }

  return config;
});
```

Initialize in `main.tsx`:
```typescript
import { useTenantStore } from '@/stores/tenant-store';
initializeApiTenant(() => useTenantStore.getState());
```

### 34.3 Update Auth Store for Tenant Login

The provider auth store login action must:
1. Call `POST /api/v1/auth/tenant/login` with `{ email, password, tenantSlug }`
2. On success, extract tenant info from the user response and set it in the tenant store
3. The tenant context persists independently so it survives auth refresh

Update `apps/provider-portal/src/stores/auth-store.ts`:
- Login calls `/auth/tenant/login` with `tenantSlug` in the payload
- After successful login, call `useTenantStore.getState().setTenant()` with tenant info from the user
- Logout also calls `useTenantStore.getState().clearTenant()`

### 34.4 DashboardLayout Component

Create `apps/provider-portal/src/components/layout/dashboard-layout.tsx`:

Same pattern as admin (Task 31):
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

### 34.5 Sidebar Component

Create `apps/provider-portal/src/components/layout/sidebar.tsx`:

Same collapsible sidebar pattern as admin, but with provider-specific nav items:

```typescript
const navItems: NavItem[] = [
  { labelKey: 'nav.dashboard', href: '/', icon: LayoutDashboard },
  { labelKey: 'nav.profile', href: '/profile', icon: UserCircle },
  { labelKey: 'nav.portfolio', href: '/portfolio', icon: Image },
  { labelKey: 'nav.bookings', href: '/bookings', icon: CalendarCheck },
  { labelKey: 'nav.reviews', href: '/reviews', icon: Star },
  { labelKey: 'nav.calendar', href: '/calendar', icon: Calendar },
  { labelKey: 'nav.messages', href: '/messages', icon: MessageSquare },
  { labelKey: 'nav.team', href: '/team', icon: Users },
  { labelKey: 'nav.analytics', href: '/analytics', icon: BarChart3 },
  { labelKey: 'nav.settings', href: '/settings', icon: Settings },
];
```

Storage key for collapse state: `saas_provider_sidebar_collapsed`

All other behavior identical to admin sidebar: collapsible, tooltips when collapsed, localStorage persistence, hidden on mobile.

### 34.6 Header Component

Create `apps/provider-portal/src/components/layout/header.tsx`:

Same pattern as admin header:
- Mobile: hamburger Sheet with provider nav items
- Right side: LanguageSwitcher, ThemeToggle, UserMenu
- UserMenu shows: user name, tenant name (from tenant store), email, logout
- Add tenant name display somewhere visible (e.g., below user name in the dropdown, or as a subtle badge in the header)

### 34.7 Dashboard Page

Create `apps/provider-portal/src/features/dashboard/dashboard-page.tsx`:

```typescript
import { useTranslation } from 'react-i18next';
import { CalendarCheck, Clock, Star, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { Link } from 'react-router';

export function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const stats = [
    { titleKey: 'dashboard.totalBookings', value: '—', icon: CalendarCheck },
    { titleKey: 'dashboard.pendingInquiries', value: '—', icon: Clock },
    { titleKey: 'dashboard.averageRating', value: '—', icon: Star },
    { titleKey: 'dashboard.revenueThisMonth', value: '—', icon: DollarSign },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground">
          {t('dashboard.welcome', { name: user?.name || 'Provider' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.titleKey}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t(stat.titleKey)}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent sections */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.recentBookings')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{t('common.comingSoon')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.recentReviews')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{t('common.comingSoon')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.quickActions')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link to="/profile">{t('dashboard.updateProfile')}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/messages">{t('dashboard.checkMessages')}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/calendar">{t('dashboard.viewCalendar')}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 34.8 Placeholder Pages

Create placeholder pages for all nav items following the same pattern as admin Task 31:

- `apps/provider-portal/src/features/profile/profile-page.tsx`
- `apps/provider-portal/src/features/portfolio/portfolio-page.tsx`
- `apps/provider-portal/src/features/bookings/bookings-page.tsx`
- `apps/provider-portal/src/features/reviews/reviews-page.tsx`
- `apps/provider-portal/src/features/calendar/calendar-page.tsx`
- `apps/provider-portal/src/features/messages/messages-page.tsx`
- `apps/provider-portal/src/features/team/team-page.tsx`
- `apps/provider-portal/src/features/analytics/analytics-page.tsx`
- `apps/provider-portal/src/features/settings/settings-page.tsx`

Each placeholder:
```typescript
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ProfilePage() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{t('profile.title')}</h1>
      <Card>
        <CardHeader><CardTitle>{t('profile.title')}</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t('common.comingSoon')}</p>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 34.9 Complete Routing

Update `apps/provider-portal/src/App.tsx`:

```typescript
import { Routes, Route, Navigate } from 'react-router';
import { LoginPage } from '@/features/auth/login-page';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { DashboardPage } from '@/features/dashboard/dashboard-page';
import { ProfilePage } from '@/features/profile/profile-page';
import { PortfolioPage } from '@/features/portfolio/portfolio-page';
import { BookingsPage } from '@/features/bookings/bookings-page';
import { ReviewsPage } from '@/features/reviews/reviews-page';
import { CalendarPage } from '@/features/calendar/calendar-page';
import { MessagesPage } from '@/features/messages/messages-page';
import { TeamPage } from '@/features/team/team-page';
import { AnalyticsPage } from '@/features/analytics/analytics-page';
import { SettingsPage } from '@/features/settings/settings-page';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
```

### 34.10 Remove Old Files

Delete `apps/provider-portal/src/pages/Dashboard.tsx` as it's replaced by features-based structure.

## Acceptance Criteria
- [ ] Provider login with email + password + tenantSlug works, sets tenant context
- [ ] Tenant context (ID, slug, name) persists in localStorage and is sent as X-Tenant-ID header on all API requests
- [ ] Sidebar renders with all 10 provider nav items
- [ ] Sidebar collapses/expands with localStorage persistence (`saas_provider_sidebar_collapsed`)
- [ ] Mobile hamburger drawer works with provider nav items
- [ ] Header shows LanguageSwitcher, ThemeToggle, UserMenu with tenant name
- [ ] Dashboard shows 4 stat cards (Total Bookings, Pending Inquiries, Average Rating, Revenue)
- [ ] Dashboard shows recent bookings, recent reviews sections (placeholder)
- [ ] Quick action buttons link to Profile, Messages, Calendar
- [ ] All placeholder pages render with title and "Coming soon"
- [ ] All routes navigate correctly
- [ ] Logout clears both auth and tenant state
- [ ] All strings from i18n translation files
- [ ] Provider portal builds with 0 errors

## Files to Create/Modify
- `apps/provider-portal/src/stores/tenant-store.ts` (create)
- `apps/provider-portal/src/stores/auth-store.ts` (modify — tenant login + tenant store integration)
- `apps/provider-portal/src/lib/api.ts` (modify — add tenant header)
- `apps/provider-portal/src/components/layout/dashboard-layout.tsx` (create)
- `apps/provider-portal/src/components/layout/sidebar.tsx` (create)
- `apps/provider-portal/src/components/layout/header.tsx` (create)
- `apps/provider-portal/src/features/dashboard/dashboard-page.tsx` (create)
- `apps/provider-portal/src/features/profile/profile-page.tsx` (create)
- `apps/provider-portal/src/features/portfolio/portfolio-page.tsx` (create)
- `apps/provider-portal/src/features/bookings/bookings-page.tsx` (create)
- `apps/provider-portal/src/features/reviews/reviews-page.tsx` (create)
- `apps/provider-portal/src/features/calendar/calendar-page.tsx` (create)
- `apps/provider-portal/src/features/messages/messages-page.tsx` (create)
- `apps/provider-portal/src/features/team/team-page.tsx` (create)
- `apps/provider-portal/src/features/analytics/analytics-page.tsx` (create)
- `apps/provider-portal/src/features/settings/settings-page.tsx` (create)
- `apps/provider-portal/src/App.tsx` (replace)
- `apps/provider-portal/src/main.tsx` (modify — add tenant store init)
- `apps/provider-portal/src/pages/Dashboard.tsx` (delete)

## Dependencies
- Task 28 (Frontend Shared Foundation) — shadcn/ui components
- Task 29 (Frontend i18n) — translation strings
- Task 30 (Frontend Auth) — auth store with tenant login, protected route
