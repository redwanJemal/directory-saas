import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { type ColumnDef, type SortingState } from '@tanstack/react-table';
import { Eye, Pencil, Ban, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableRowActions, type RowAction } from '@/components/data-table/data-table-row-actions';
import { StatusBadge } from '@/components/status-badge';
import { useTenantsQuery } from './hooks/use-tenants';
import { CreateTenantDialog } from './components/create-tenant-dialog';
import { EditTenantDialog } from './components/edit-tenant-dialog';
import { ViewTenantSheet } from './components/view-tenant-sheet';
import { SuspendTenantDialog } from './components/suspend-tenant-dialog';
import type { Tenant } from './types';

function sortingToApiSort(sorting: SortingState): string | undefined {
  if (sorting.length === 0) return undefined;
  return sorting
    .map((s) => (s.desc ? `-${s.id}` : s.id))
    .join(',');
}

export function TenantsPage() {
  const { t } = useTranslation();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sorting, setSorting] = useState<SortingState>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [editTenant, setEditTenant] = useState<Tenant | null>(null);
  const [viewTenant, setViewTenant] = useState<Tenant | null>(null);
  const [suspendTenant, setSuspendTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, sorting]);

  const { data, isLoading } = useTenantsQuery({
    page,
    pageSize,
    search: debouncedSearch || undefined,
    status: statusFilter,
    sort: sortingToApiSort(sorting),
  });

  const columns = useMemo<ColumnDef<Tenant, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('tenants.name')} />
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.getValue('name')}</span>
        ),
      },
      {
        accessorKey: 'slug',
        header: () => t('tenants.slug'),
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.getValue('slug')}</span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'status',
        header: () => t('common.status'),
        cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
        enableSorting: false,
      },
      {
        accessorKey: 'plan',
        header: () => t('tenants.plan'),
        cell: ({ row }) => {
          const plan = row.original.plan;
          return <span>{plan?.name ?? '—'}</span>;
        },
        enableSorting: false,
      },
      {
        accessorKey: 'usersCount',
        header: () => t('tenants.usersCount'),
        cell: ({ row }) => <span>{row.original.usersCount ?? 0}</span>,
        enableSorting: false,
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('tenants.createdAt')}
          />
        ),
        cell: ({ row }) => (
          <span>
            {new Date(row.getValue('createdAt')).toLocaleDateString()}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => t('common.actions'),
        cell: ({ row }) => {
          const tenant = row.original;
          const actions: RowAction[] = [
            {
              label: t('common.view'),
              icon: Eye,
              onClick: () => setViewTenant(tenant),
            },
            {
              label: t('common.edit'),
              icon: Pencil,
              onClick: () => setEditTenant(tenant),
            },
            {
              label: t('tenants.suspendTenant'),
              icon: Ban,
              onClick: () => setSuspendTenant(tenant),
              variant: 'destructive',
              separator: true,
            },
          ];
          return <DataTableRowActions actions={actions} />;
        },
        enableSorting: false,
      },
    ],
    [t],
  );

  const statusFilterOptions = [
    { label: t('common.active'), value: 'active' },
    { label: t('common.suspended'), value: 'suspended' },
    { label: t('tenants.cancelled'), value: 'cancelled' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          {t('tenants.title')}
        </h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('tenants.createTenant')}
        </Button>
      </div>

      <DataTableToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('tenants.searchPlaceholder')}
        filters={[
          {
            key: 'status',
            label: t('common.status'),
            options: statusFilterOptions,
            value: statusFilter,
            onChange: setStatusFilter,
          },
        ]}
      />

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        pageCount={data?.pagination?.totalPages ?? 0}
        page={page}
        pageSize={pageSize}
        totalCount={data?.pagination?.totalCount ?? 0}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        onSortingChange={setSorting}
        sorting={sorting}
        isLoading={isLoading}
      />

      <CreateTenantDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditTenantDialog
        open={!!editTenant}
        onOpenChange={(open) => !open && setEditTenant(null)}
        tenant={editTenant}
      />
      <ViewTenantSheet
        open={!!viewTenant}
        onOpenChange={(open) => !open && setViewTenant(null)}
        tenant={viewTenant}
      />
      <SuspendTenantDialog
        open={!!suspendTenant}
        onOpenChange={(open) => !open && setSuspendTenant(null)}
        tenant={suspendTenant}
      />
    </div>
  );
}
