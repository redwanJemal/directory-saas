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
