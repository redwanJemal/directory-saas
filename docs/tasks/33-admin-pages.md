# Task 33: Admin App — Users, Roles, Subscriptions, Audit, Jobs, Settings Pages

## Summary
Build all remaining admin pages: Users management, Roles & Permissions, Subscriptions, Audit Logs, Jobs & Queues, and Settings. Each page uses the reusable data table component from Task 32 and follows the same patterns.

## Current State
- Admin app has full layout (Task 31) and working Tenants page with data table (Task 32)
- Data table component exists with sorting, filtering, pagination
- Status badge component exists
- Remaining nav items show placeholder "Coming soon" pages
- Backend endpoints available:
  - Users: `GET /api/v1/admin/users`, `GET /api/v1/admin/users/:id`
  - Roles: `GET /api/v1/roles`, `POST /api/v1/roles`, `PATCH /api/v1/roles/:id`, `DELETE /api/v1/roles/:id`, `GET /api/v1/roles/:id/permissions`
  - Subscriptions: `GET /api/v1/admin/subscriptions`, `GET /api/v1/subscription-plans`
  - Audit: `GET /api/v1/admin/audit-logs`
  - Jobs: `GET /api/v1/admin/queues/stats`
  - Health: `GET /api/v1/health/ready`, `GET /api/v1/health/live`

## Required Changes

### 33.1 Users Page

Create `apps/admin/src/features/users/`:
```
features/users/
├── users-page.tsx
├── types.ts
├── hooks/
│   └── use-users.ts
└── components/
    └── view-user-sheet.tsx
```

**UsersPage**:
- Data table with columns: Name, Email, Type (Admin/Tenant/Client with badge), Status, Last Login (relative time format), Actions
- Filter by user type (all/admin/tenant/client)
- Search by name or email
- Pagination
- View user details in Sheet (slide-out panel): full user info, tenant association, role, login history
- No create/edit — users are created through auth/tenant flows

**TanStack Query hook** (`use-users.ts`):
```typescript
interface UsersQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: 'admin' | 'tenant' | 'client' | 'all';
  sort?: string;
}

export function useUsersQuery(params: UsersQueryParams) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      // Build query params following backend bracket notation
      if (params.search) queryParams.set('filter[name][contains]', params.search);
      if (params.type && params.type !== 'all') queryParams.set('filter[type]', params.type);
      if (params.page) queryParams.set('page', String(params.page));
      if (params.pageSize) queryParams.set('pageSize', String(params.pageSize));
      if (params.sort) queryParams.set('sort', params.sort);
      const response = await api.get(`/admin/users?${queryParams}`);
      return response.data;
    },
  });
}
```

**User type badge styling**:
- Admin: purple badge
- Tenant: blue badge
- Client: green badge

### 33.2 Roles & Permissions Page

Create `apps/admin/src/features/roles/`:
```
features/roles/
├── roles-page.tsx
├── types.ts
├── schemas.ts
├── hooks/
│   └── use-roles.ts
└── components/
    ├── create-role-dialog.tsx
    ├── edit-role-dialog.tsx
    ├── permissions-grid.tsx
    └── view-role-sheet.tsx
```

**RolesPage**:
- Data table listing all roles
- Columns: Role Name, Tenant (or "Platform" for system roles), Permissions Count, Created At, Actions
- Group/filter by tenant
- Create Role dialog: name + description + permissions selection
- Edit Role dialog: same fields, pre-populated
- Delete role (with confirmation)

**PermissionsGrid** (`permissions-grid.tsx`):
- Matrix-style checkbox grid: rows = resources (tenants, users, roles, subscriptions, etc.), columns = actions (create, read, update, delete, manage)
- Each cell is a Checkbox
- Select all row / select all column shortcuts
- Used in both Create and Edit dialogs

```typescript
interface PermissionsGridProps {
  selectedPermissions: string[];
  onPermissionsChange: (permissions: string[]) => void;
}

// Permissions follow pattern: resource:action
const resources = ['tenants', 'users', 'roles', 'subscriptions', 'audit', 'settings'];
const actions = ['create', 'read', 'update', 'delete', 'manage'];
```

**TanStack Query hooks** (`use-roles.ts`):
- `useRolesQuery(params)` — list roles
- `useCreateRoleMutation()` — create with permissions
- `useUpdateRoleMutation()` — update role + permissions
- `useDeleteRoleMutation()` — delete role

**Zod schemas** (`schemas.ts`):
```typescript
export const createRoleSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(200).optional(),
  permissions: z.array(z.string()).min(1, 'At least one permission required'),
  tenantId: z.string().uuid().optional(),
});
```

### 33.3 Subscriptions Page

Create `apps/admin/src/features/subscriptions/`:
```
features/subscriptions/
├── subscriptions-page.tsx
├── types.ts
├── hooks/
│   └── use-subscriptions.ts
└── components/
    ├── change-plan-dialog.tsx
    └── view-subscription-sheet.tsx
```

**SubscriptionsPage**:
- Data table with columns: Tenant Name, Plan Name, Status (badge), Start Date, End Date, Actions
- Filter by status (all/active/cancelled/expired)
- Sort by start date, tenant name
- View subscription details in Sheet: full subscription info, usage stats (if available), plan limits
- Change Plan dialog: dropdown with available plans, confirmation

**TanStack Query hooks** (`use-subscriptions.ts`):
- `useSubscriptionsQuery(params)` — list subscriptions
- `useSubscriptionPlansQuery()` — list available plans
- `useChangePlanMutation()` — change tenant's plan

### 33.4 Audit Logs Page

Create `apps/admin/src/features/audit-logs/`:
```
features/audit-logs/
├── audit-logs-page.tsx
├── types.ts
├── hooks/
│   └── use-audit-logs.ts
└── components/
    └── view-audit-dialog.tsx
```

**AuditLogsPage**:
- Data table with columns: Timestamp (formatted with date-fns or Intl), User (name + email), Action, Resource, Details (truncated)
- Filters:
  - Date range (two date inputs: from/to)
  - User (search/select)
  - Action type (dropdown: create, update, delete, login, logout)
  - Resource type (dropdown: tenant, user, role, subscription)
- View full audit entry in Dialog: all fields including full details JSON, before/after change diff
- Auto-refresh toggle (polling every 10 seconds when enabled)
- Sort by timestamp (default: newest first)

**Auto-refresh implementation**:
```typescript
const [autoRefresh, setAutoRefresh] = useState(false);

const { data, isLoading } = useQuery({
  queryKey: ['audit-logs', params],
  queryFn: fetchAuditLogs,
  refetchInterval: autoRefresh ? 10_000 : false,
});
```

### 33.5 Jobs & Queues Page

Create `apps/admin/src/features/jobs/`:
```
features/jobs/
├── jobs-page.tsx
├── types.ts
└── hooks/
    └── use-jobs.ts
```

**JobsPage**:
- Overview cards (grid of 6 cards, one per queue: email, notification, export, cleanup, indexing, ai)
- Each card shows: queue name, icon, pending count, active count, completed count (24h), failed count (24h)
- Card colors: pending=blue, active=green, failed=red
- Link to Bull Board dashboard: Button → opens `/api/v1/admin/queues` in new tab
- Auto-refresh: poll queue stats every 5 seconds

**Queue card component pattern**:
```typescript
interface QueueStats {
  name: string;
  pending: number;
  active: number;
  completed: number;
  failed: number;
}

function QueueCard({ stats }: { stats: QueueStats }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{stats.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>Pending: <span className="font-bold text-blue-600">{stats.pending}</span></div>
          <div>Active: <span className="font-bold text-green-600">{stats.active}</span></div>
          <div>Completed: <span className="font-bold">{stats.completed}</span></div>
          <div>Failed: <span className="font-bold text-red-600">{stats.failed}</span></div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 33.6 Settings Page

Create `apps/admin/src/features/settings/`:
```
features/settings/
├── settings-page.tsx
└── hooks/
    └── use-settings.ts
```

**SettingsPage** — Tabbed layout with:

**Platform Settings tab**:
- Form: application name, default plan (dropdown), support email
- Save button with loading state
- Toast on success

**System Health tab**:
- Fetch from `GET /api/v1/health/ready`
- Display service statuses: database, redis, meilisearch, storage
- Status indicators: green circle = healthy, red circle = unhealthy
- Auto-refresh every 30 seconds
- Last checked timestamp

**Environment Info tab**:
- Display non-sensitive environment info
- Node version, app version, environment (development/production)
- Uptime

### 33.7 Update i18n Translations

Add translation keys for all new pages to `apps/admin/src/i18n/en.json` and `am.json`. Ensure all visible strings use `t()`.

### 33.8 Date Formatting

Install `date-fns` for date formatting:
```bash
cd apps/admin && npm install date-fns
```

Use throughout for consistent formatting:
```typescript
import { format, formatDistanceToNow } from 'date-fns';

// Full date: "Mar 15, 2026"
format(new Date(timestamp), 'MMM d, yyyy');

// Relative: "2 hours ago"
formatDistanceToNow(new Date(timestamp), { addSuffix: true });
```

## Acceptance Criteria
- [ ] Users page: data table loads users, filter by type, search by name/email, view user details in Sheet
- [ ] Roles page: list roles, create/edit with permissions grid, delete with confirmation
- [ ] Permissions grid: checkbox matrix for resource x action, working select/deselect
- [ ] Subscriptions page: list subscriptions, filter by status, view details, change plan dialog
- [ ] Audit Logs page: data table with date range, user, action, resource filters; view full entry; auto-refresh toggle
- [ ] Jobs page: queue stats cards for all 6 queues, auto-refresh, link to Bull Board
- [ ] Settings page: platform settings form, system health display, environment info
- [ ] All pages use TanStack Query hooks for data fetching
- [ ] All forms use Zod validation
- [ ] All strings use i18n translations
- [ ] Toast notifications on success/error for all mutations
- [ ] All pages are responsive on mobile
- [ ] Admin app builds with 0 errors

## Files to Create/Modify
- `apps/admin/src/features/users/users-page.tsx` (replace placeholder)
- `apps/admin/src/features/users/types.ts` (create)
- `apps/admin/src/features/users/hooks/use-users.ts` (create)
- `apps/admin/src/features/users/components/view-user-sheet.tsx` (create)
- `apps/admin/src/features/roles/roles-page.tsx` (replace placeholder)
- `apps/admin/src/features/roles/types.ts` (create)
- `apps/admin/src/features/roles/schemas.ts` (create)
- `apps/admin/src/features/roles/hooks/use-roles.ts` (create)
- `apps/admin/src/features/roles/components/create-role-dialog.tsx` (create)
- `apps/admin/src/features/roles/components/edit-role-dialog.tsx` (create)
- `apps/admin/src/features/roles/components/permissions-grid.tsx` (create)
- `apps/admin/src/features/roles/components/view-role-sheet.tsx` (create)
- `apps/admin/src/features/subscriptions/subscriptions-page.tsx` (replace placeholder)
- `apps/admin/src/features/subscriptions/types.ts` (create)
- `apps/admin/src/features/subscriptions/hooks/use-subscriptions.ts` (create)
- `apps/admin/src/features/subscriptions/components/change-plan-dialog.tsx` (create)
- `apps/admin/src/features/subscriptions/components/view-subscription-sheet.tsx` (create)
- `apps/admin/src/features/audit-logs/audit-logs-page.tsx` (replace placeholder)
- `apps/admin/src/features/audit-logs/types.ts` (create)
- `apps/admin/src/features/audit-logs/hooks/use-audit-logs.ts` (create)
- `apps/admin/src/features/audit-logs/components/view-audit-dialog.tsx` (create)
- `apps/admin/src/features/jobs/jobs-page.tsx` (replace placeholder)
- `apps/admin/src/features/jobs/types.ts` (create)
- `apps/admin/src/features/jobs/hooks/use-jobs.ts` (create)
- `apps/admin/src/features/settings/settings-page.tsx` (replace placeholder)
- `apps/admin/src/features/settings/hooks/use-settings.ts` (create)
- `apps/admin/src/i18n/en.json` (modify — add new translation keys)
- `apps/admin/src/i18n/am.json` (modify — add new translation keys)

## Dependencies
- Task 28 (Frontend Shared Foundation) — shadcn/ui components
- Task 29 (Frontend i18n) — translation setup
- Task 30 (Frontend Auth) — auth store, API client
- Task 31 (Admin Layout) — DashboardLayout, sidebar routing
- Task 32 (Admin Tenants) — data table component, status badge
