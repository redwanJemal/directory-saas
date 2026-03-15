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
