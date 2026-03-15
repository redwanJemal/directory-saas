import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { type ColumnDef, type SortingState } from '@tanstack/react-table';
import { Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import {
  DataTableRowActions,
  type RowAction,
} from '@/components/data-table/data-table-row-actions';
import { StatusBadge } from '@/components/status-badge';
import { cn } from '@/lib/utils';
import { useUsersQuery } from './hooks/use-users';
import { ViewUserSheet } from './components/view-user-sheet';
import type { User } from './types';

const typeStyles: Record<string, string> = {
  admin:
    'bg-purple-500/10 text-purple-700 border-purple-500/20 dark:bg-purple-500/20 dark:text-purple-400',
  tenant:
    'bg-blue-500/10 text-blue-700 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400',
  client:
    'bg-green-500/10 text-green-700 border-green-500/20 dark:bg-green-500/20 dark:text-green-400',
};

function sortingToApiSort(sorting: SortingState): string | undefined {
  if (sorting.length === 0) return undefined;
  return sorting.map((s) => (s.desc ? `-${s.id}` : s.id)).join(',');
}

export function UsersPage() {
  const { t } = useTranslation();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sorting, setSorting] = useState<SortingState>([]);

  const [viewUser, setViewUser] = useState<User | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, typeFilter, sorting]);

  const { data, isLoading } = useUsersQuery({
    page,
    pageSize,
    search: debouncedSearch || undefined,
    type: typeFilter,
    sort: sortingToApiSort(sorting),
  });

  const columns = useMemo<ColumnDef<User, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('users.name')} />
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.getValue('name')}</span>
        ),
      },
      {
        accessorKey: 'email',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('users.email')} />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.getValue('email')}</span>
        ),
      },
      {
        accessorKey: 'type',
        header: () => t('users.type'),
        cell: ({ row }) => {
          const type = row.getValue('type') as string;
          return (
            <Badge
              variant="outline"
              className={cn(
                'font-medium capitalize',
                typeStyles[type] ?? '',
              )}
            >
              {t(`users.${type}`)}
            </Badge>
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
        accessorKey: 'lastLoginAt',
        header: () => t('users.lastLogin'),
        cell: ({ row }) => {
          const lastLogin = row.getValue('lastLoginAt') as string | undefined;
          return (
            <span className="text-muted-foreground">
              {lastLogin
                ? formatDistanceToNow(new Date(lastLogin), { addSuffix: true })
                : '—'}
            </span>
          );
        },
        enableSorting: false,
      },
      {
        id: 'actions',
        header: () => t('common.actions'),
        cell: ({ row }) => {
          const user = row.original;
          const actions: RowAction[] = [
            {
              label: t('common.view'),
              icon: Eye,
              onClick: () => setViewUser(user),
            },
          ];
          return <DataTableRowActions actions={actions} />;
        },
        enableSorting: false,
      },
    ],
    [t],
  );

  const typeFilterOptions = [
    { label: t('users.admin'), value: 'admin' },
    { label: t('users.tenant'), value: 'tenant' },
    { label: t('users.client'), value: 'client' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          {t('users.title')}
        </h1>
      </div>

      <DataTableToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('users.searchPlaceholder')}
        filters={[
          {
            key: 'type',
            label: t('users.type'),
            options: typeFilterOptions,
            value: typeFilter,
            onChange: setTypeFilter,
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

      <ViewUserSheet
        open={!!viewUser}
        onOpenChange={(open) => !open && setViewUser(null)}
        user={viewUser}
      />
    </div>
  );
}
