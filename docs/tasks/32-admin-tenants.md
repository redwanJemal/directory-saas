# Task 32: Admin App — Tenants Management Page

## Summary
Build the tenants CRUD page for the admin app, including a reusable data table component with sorting, filtering, and pagination, plus create/edit/view/suspend dialogs. This is the first fully functional admin page with real API integration.

## Current State
- Admin app has layout with sidebar, header, and routing (Task 31)
- TenantsPage exists as a placeholder (just title + "Coming soon")
- No data table component, no CRUD dialogs, no TanStack Query hooks
- Backend endpoints available:
  - `GET /api/v1/admin/tenants` — list with query parameters (filter, sort, pagination)
  - `POST /api/v1/admin/tenants` — create tenant
  - `GET /api/v1/admin/tenants/:id` — get single tenant
  - `PATCH /api/v1/admin/tenants/:id` — update tenant
  - `PATCH /api/v1/admin/tenants/:id/suspend` — suspend tenant
- Backend query parameter format: `?filter[status]=active&sort=-createdAt&page=1&pageSize=20`

## Required Changes

### 32.1 Install @tanstack/react-table

```bash
cd apps/admin && npm install @tanstack/react-table
```

### 32.2 Data Table Components

Create `apps/admin/src/components/data-table/` directory:

```
apps/admin/src/components/data-table/
├── data-table.tsx
├── data-table-pagination.tsx
├── data-table-toolbar.tsx
├── data-table-row-actions.tsx
├── data-table-column-header.tsx
├── types.ts
└── index.ts
```

**`data-table.tsx`** — Main table component:

```typescript
import { useState } from 'react';
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTablePagination } from './data-table-pagination';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount?: number;
  page?: number;
  pageSize?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSortingChange?: (sorting: SortingState) => void;
  sorting?: SortingState;
  isLoading?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageCount,
  page = 1,
  pageSize = 20,
  totalCount = 0,
  onPageChange,
  onPageSizeChange,
  onSortingChange,
  sorting: externalSorting,
  isLoading,
}: DataTableProps<TData, TValue>) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);

  const sorting = externalSorting ?? internalSorting;

  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    onSortingChange: onSortingChange
      ? (updater) => {
          const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
          onSortingChange(newSorting);
        }
      : setInternalSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: !!onSortingChange,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        pageCount={pageCount ?? 0}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}
```

**`data-table-pagination.tsx`** — Pagination controls with page size selector, prev/next, showing "X of Y":

```typescript
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DataTablePaginationProps {
  page: number;
  pageSize: number;
  totalCount: number;
  pageCount: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

export function DataTablePagination({
  page, pageSize, totalCount, pageCount, onPageChange, onPageSizeChange,
}: DataTablePaginationProps) {
  const { t } = useTranslation();
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  return (
    <div className="flex items-center justify-between px-2">
      <div className="text-sm text-muted-foreground">
        {t('common.showing', { from, to, total: totalCount })}
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">{t('common.rowsPerPage')}</p>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange?.(Number(value))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50, 100].map((size) => (
                <SelectItem key={size} value={String(size)}>{size}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => onPageChange?.(1)}>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => onPageChange?.(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            {page} / {pageCount}
          </span>
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= pageCount} onClick={() => onPageChange?.(page + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= pageCount} onClick={() => onPageChange?.(pageCount)}>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
```

**`data-table-column-header.tsx`** — Sortable column header:

```typescript
import { type Column } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DataTableColumnHeaderProps<TData, TValue> extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn('-ml-3 h-8', className)}
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      <span>{title}</span>
      {column.getIsSorted() === 'desc' ? (
        <ArrowDown className="ml-2 h-4 w-4" />
      ) : column.getIsSorted() === 'asc' ? (
        <ArrowUp className="ml-2 h-4 w-4" />
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4" />
      )}
    </Button>
  );
}
```

**`data-table-toolbar.tsx`** — Search input, filter dropdowns:

```typescript
import { useTranslation } from 'react-i18next';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FilterOption {
  label: string;
  value: string;
}

interface DataTableToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: Array<{
    key: string;
    label: string;
    options: FilterOption[];
    value: string;
    onChange: (value: string) => void;
  }>;
}

export function DataTableToolbar({
  searchValue, onSearchChange, searchPlaceholder, filters,
}: DataTableToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex flex-1 items-center gap-2">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder ?? t('common.search')}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8"
          />
          {searchValue && (
            <Button variant="ghost" size="icon" className="absolute right-1 top-1 h-7 w-7" onClick={() => onSearchChange('')}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {filters?.map((filter) => (
          <Select key={filter.key} value={filter.value} onValueChange={filter.onChange}>
            <SelectTrigger className="h-9 w-[150px]">
              <SelectValue placeholder={filter.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{filter.label}</SelectItem>
              {filter.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
      </div>
    </div>
  );
}
```

**`data-table-row-actions.tsx`** — 3-dot dropdown for row actions:

```typescript
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface RowAction {
  label: string;
  onClick: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'destructive';
  separator?: boolean;
}

interface DataTableRowActionsProps {
  actions: RowAction[];
}

export function DataTableRowActions({ actions }: DataTableRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action, i) => (
          <div key={i}>
            {action.separator && <DropdownMenuSeparator />}
            <DropdownMenuItem
              onClick={action.onClick}
              className={action.variant === 'destructive' ? 'text-destructive' : ''}
            >
              {action.icon && <action.icon className="mr-2 h-4 w-4" />}
              {action.label}
            </DropdownMenuItem>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**`index.ts`** — barrel export:
```typescript
export { DataTable } from './data-table';
export { DataTablePagination } from './data-table-pagination';
export { DataTableToolbar } from './data-table-toolbar';
export { DataTableRowActions, type RowAction } from './data-table-row-actions';
export { DataTableColumnHeader } from './data-table-column-header';
```

### 32.3 Tenant Types

Create `apps/admin/src/features/tenants/types.ts`:

```typescript
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'suspended' | 'cancelled';
  planId?: string;
  plan?: {
    id: string;
    name: string;
  };
  usersCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTenantInput {
  name: string;
  slug: string;
  ownerEmail: string;
  planId?: string;
}

export interface UpdateTenantInput {
  name?: string;
  status?: string;
}

export interface SuspendTenantInput {
  reason: string;
}
```

### 32.4 TanStack Query Hooks

Create `apps/admin/src/features/tenants/hooks/use-tenants.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Tenant, CreateTenantInput, UpdateTenantInput, SuspendTenantInput } from '../types';

interface TenantsQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  sort?: string;
}

interface TenantsResponse {
  data: Tenant[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

export function useTenantsQuery(params: TenantsQueryParams = {}) {
  return useQuery({
    queryKey: ['tenants', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.set('page', String(params.page));
      if (params.pageSize) queryParams.set('pageSize', String(params.pageSize));
      if (params.search) queryParams.set('filter[name][contains]', params.search);
      if (params.status && params.status !== 'all') queryParams.set('filter[status]', params.status);
      if (params.sort) queryParams.set('sort', params.sort);

      const response = await api.get<TenantsResponse>(`/admin/tenants?${queryParams}`);
      return response.data;
    },
  });
}

export function useTenantQuery(id: string) {
  return useQuery({
    queryKey: ['tenants', id],
    queryFn: async () => {
      const response = await api.get<{ data: Tenant }>(`/admin/tenants/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateTenantMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTenantInput) => {
      const response = await api.post<{ data: Tenant }>('/admin/tenants', input);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
  });
}

export function useUpdateTenantMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateTenantInput & { id: string }) => {
      const response = await api.patch<{ data: Tenant }>(`/admin/tenants/${id}`, input);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
  });
}

export function useSuspendTenantMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: SuspendTenantInput & { id: string }) => {
      const response = await api.patch<{ data: Tenant }>(`/admin/tenants/${id}/suspend`, input);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
  });
}
```

### 32.5 Tenant Zod Schemas

Create `apps/admin/src/features/tenants/schemas.ts`:

```typescript
import { z } from 'zod';

export const createTenantSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only').min(2).max(50),
  ownerEmail: z.string().email('Invalid email address'),
  planId: z.string().uuid().optional(),
});

export const updateTenantSchema = z.object({
  name: z.string().min(2).max(100).optional(),
});

export const suspendTenantSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(500),
});

export type CreateTenantFormData = z.infer<typeof createTenantSchema>;
export type UpdateTenantFormData = z.infer<typeof updateTenantSchema>;
export type SuspendTenantFormData = z.infer<typeof suspendTenantSchema>;
```

### 32.6 Tenants Page

Replace the placeholder `apps/admin/src/features/tenants/tenants-page.tsx` with the full implementation:

The page must include:
- Page header with title + "Create Tenant" button
- DataTableToolbar with search (by name/slug) and status filter dropdown (all/active/suspended/cancelled)
- DataTable with columns: Name, Slug, Status (badge), Plan, Users Count, Created At (formatted), Actions (dropdown)
- Server-side pagination, sorting (by name, created date), and filtering
- State for: page, pageSize, search (debounced), status filter, sorting
- Status badges with colors: active=green, suspended=yellow, cancelled=red

The page state should be managed with `useState` hooks:
```typescript
const [page, setPage] = useState(1);
const [pageSize, setPageSize] = useState(20);
const [search, setSearch] = useState('');
const [debouncedSearch, setDebouncedSearch] = useState('');
const [statusFilter, setStatusFilter] = useState('all');
const [sorting, setSorting] = useState<SortingState>([]);
```

Use `useEffect` with a 300ms debounce for search input.

### 32.7 Create Tenant Dialog

Create `apps/admin/src/features/tenants/components/create-tenant-dialog.tsx`:

- Dialog with form: name, slug (auto-generated from name using lowercase + hyphenated), owner email, plan selection (optional dropdown)
- Auto-generate slug from name: replace spaces with hyphens, lowercase, remove special chars
- Zod validation with error display per field
- Submit calls `useCreateTenantMutation`
- Toast success/error notifications using Sonner
- Close dialog on success

### 32.8 Edit Tenant Dialog

Create `apps/admin/src/features/tenants/components/edit-tenant-dialog.tsx`:

- Dialog pre-populated with existing tenant data
- Update name
- Zod validation
- Submit calls `useUpdateTenantMutation`

### 32.9 View Tenant Sheet

Create `apps/admin/src/features/tenants/components/view-tenant-sheet.tsx`:

- Sheet (slide-out panel from right) showing full tenant details
- Sections: General Info, Subscription, Users summary
- Read-only display with labels and values

### 32.10 Suspend Tenant Dialog

Create `apps/admin/src/features/tenants/components/suspend-tenant-dialog.tsx`:

- AlertDialog with warning icon/text
- Reason textarea (required)
- Zod validation
- Submit calls `useSuspendTenantMutation`
- Destructive styling

### 32.11 Status Badge Component

Create `apps/admin/src/components/status-badge.tsx`:

```typescript
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusStyles: Record<string, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  suspended: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  pending: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn('font-medium capitalize', statusStyles[status] ?? '', className)}>
      {status}
    </Badge>
  );
}
```

## Acceptance Criteria
- [ ] @tanstack/react-table installed
- [ ] Data table component renders with columns, supports server-side sorting/pagination/filtering
- [ ] Tenants page loads tenant data from `GET /api/v1/admin/tenants`
- [ ] Search by name with 300ms debounce works
- [ ] Filter by status (active/suspended/cancelled) works
- [ ] Sort by name and created date works
- [ ] Pagination controls work (page size, prev/next, first/last)
- [ ] Create Tenant dialog: form with validation, auto-slug generation, submits to API, shows toast
- [ ] Edit Tenant dialog: pre-populated form, submits update to API
- [ ] View Tenant sheet: slide-out panel with tenant details
- [ ] Suspend Tenant dialog: confirmation with reason, destructive styling
- [ ] Status badges show colored indicators per status
- [ ] Loading skeleton shown while data is fetching
- [ ] Empty state shown when no results
- [ ] All strings from i18n translation files
- [ ] All 3 admin app builds with 0 errors

## Files to Create/Modify
- `apps/admin/src/components/data-table/data-table.tsx` (create)
- `apps/admin/src/components/data-table/data-table-pagination.tsx` (create)
- `apps/admin/src/components/data-table/data-table-toolbar.tsx` (create)
- `apps/admin/src/components/data-table/data-table-row-actions.tsx` (create)
- `apps/admin/src/components/data-table/data-table-column-header.tsx` (create)
- `apps/admin/src/components/data-table/types.ts` (create)
- `apps/admin/src/components/data-table/index.ts` (create)
- `apps/admin/src/components/status-badge.tsx` (create)
- `apps/admin/src/features/tenants/types.ts` (create)
- `apps/admin/src/features/tenants/schemas.ts` (create)
- `apps/admin/src/features/tenants/hooks/use-tenants.ts` (create)
- `apps/admin/src/features/tenants/tenants-page.tsx` (replace)
- `apps/admin/src/features/tenants/components/create-tenant-dialog.tsx` (create)
- `apps/admin/src/features/tenants/components/edit-tenant-dialog.tsx` (create)
- `apps/admin/src/features/tenants/components/view-tenant-sheet.tsx` (create)
- `apps/admin/src/features/tenants/components/suspend-tenant-dialog.tsx` (create)
- `apps/admin/src/i18n/en.json` (modify — ensure tenants translations exist)

## Dependencies
- Task 28 (Frontend Shared Foundation) — shadcn/ui components (Table, Dialog, Sheet, Badge, etc.)
- Task 29 (Frontend i18n) — translation strings
- Task 30 (Frontend Auth) — auth store, API client with auth interceptor
- Task 31 (Admin Layout) — DashboardLayout, sidebar routing
