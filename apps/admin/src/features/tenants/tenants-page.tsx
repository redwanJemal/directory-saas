import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { type ColumnDef, type SortingState } from '@tanstack/react-table';
import {
  Eye,
  Pencil,
  Ban,
  Plus,
  ShieldCheck,
  ShieldOff,
  StarIcon,
  StarOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import {
  DataTableRowActions,
  type RowAction,
} from '@/components/data-table/data-table-row-actions';
import { StatusBadge } from '@/components/status-badge';
import { toast } from 'sonner';
import {
  useTenantsQuery,
  useVerifyTenantMutation,
  useFeatureTenantMutation,
} from './hooks/use-tenants';
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
  const [countryFilter, setCountryFilter] = useState('all');
  const [verifiedFilter, setVerifiedFilter] = useState('all');
  const [sorting, setSorting] = useState<SortingState>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [editTenant, setEditTenant] = useState<Tenant | null>(null);
  const [viewTenant, setViewTenant] = useState<Tenant | null>(null);
  const [suspendTenant, setSuspendTenant] = useState<Tenant | null>(null);

  const verifyMutation = useVerifyTenantMutation();
  const featureMutation = useFeatureTenantMutation();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, countryFilter, verifiedFilter, sorting]);

  const { data, isLoading } = useTenantsQuery({
    page,
    pageSize,
    search: debouncedSearch || undefined,
    status: statusFilter,
    country: countryFilter,
    verified: verifiedFilter,
    sort: sortingToApiSort(sorting),
  });

  const handleVerify = (tenant: Tenant, verified: boolean) => {
    verifyMutation.mutate(
      { id: tenant.id, verified },
      {
        onSuccess: () => {
          toast.success(
            verified
              ? t('tenants.verified')
              : t('tenants.unverified'),
          );
        },
      },
    );
  };

  const handleFeature = (tenant: Tenant, featured: boolean) => {
    featureMutation.mutate(
      { id: tenant.id, featured },
      {
        onSuccess: () => {
          toast.success(
            featured
              ? t('tenants.featured')
              : t('tenants.unfeatured'),
          );
        },
      },
    );
  };

  const columns = useMemo<ColumnDef<Tenant, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('tenants.name')} />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="font-medium">{row.getValue('name')}</span>
            {row.original.providerProfile?.isVerified && (
              <ShieldCheck className="h-4 w-4 text-primary" />
            )}
            {row.original.providerProfile?.isFeatured && (
              <StarIcon className="h-4 w-4 text-primary fill-primary" />
            )}
          </div>
        ),
      },
      {
        accessorKey: 'country',
        header: () => t('tenants.country'),
        cell: ({ row }) => (
          <span>
            {row.original.providerProfile?.country ?? '—'}
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'city',
        header: () => t('tenants.city'),
        cell: ({ row }) => (
          <span>
            {row.original.providerProfile?.city ?? '—'}
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'categories',
        header: () => t('tenants.categories'),
        cell: ({ row }) => {
          const categories =
            row.original.providerProfile?.categories ?? [];
          if (categories.length === 0) return <span>—</span>;
          return (
            <div className="flex flex-wrap gap-1">
              {categories.slice(0, 2).map((c) => (
                <Badge key={c.category.id} variant="secondary" className="text-xs">
                  {c.category.name}
                </Badge>
              ))}
              {categories.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{categories.length - 2}
                </Badge>
              )}
            </div>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: 'status',
        header: () => t('common.status'),
        cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
        enableSorting: false,
      },
      {
        accessorKey: 'contactClicks',
        header: () => t('tenants.contactClicks'),
        cell: ({ row }) => (
          <span>
            {row.original.providerProfile?._count?.contactClicks ?? 0}
          </span>
        ),
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
          const isVerified = tenant.providerProfile?.isVerified ?? false;
          const isFeatured = tenant.providerProfile?.isFeatured ?? false;

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
              label: isVerified
                ? t('tenants.removeVerification')
                : t('tenants.verifyBusiness'),
              icon: isVerified ? ShieldOff : ShieldCheck,
              onClick: () => handleVerify(tenant, !isVerified),
            },
            {
              label: isFeatured
                ? t('tenants.unfeatureBusiness')
                : t('tenants.featureBusiness'),
              icon: isFeatured ? StarOff : StarIcon,
              onClick: () => handleFeature(tenant, !isFeatured),
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
    [t, verifyMutation.isPending, featureMutation.isPending],
  );

  const statusFilterOptions = [
    { label: t('common.active'), value: 'active' },
    { label: t('common.suspended'), value: 'suspended' },
    { label: t('tenants.cancelled'), value: 'cancelled' },
  ];

  const countryOptions = [
    { label: 'UAE', value: 'AE' },
    { label: 'Saudi Arabia', value: 'SA' },
    { label: 'Kuwait', value: 'KW' },
    { label: 'Qatar', value: 'QA' },
    { label: 'Bahrain', value: 'BH' },
    { label: 'Oman', value: 'OM' },
  ];

  const verifiedOptions = [
    { label: t('tenants.verifiedLabel'), value: 'true' },
    { label: t('tenants.unverifiedLabel'), value: 'false' },
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
          {
            key: 'country',
            label: t('tenants.country'),
            options: countryOptions,
            value: countryFilter,
            onChange: setCountryFilter,
          },
          {
            key: 'verified',
            label: t('tenants.verifiedLabel'),
            options: verifiedOptions,
            value: verifiedFilter,
            onChange: setVerifiedFilter,
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
