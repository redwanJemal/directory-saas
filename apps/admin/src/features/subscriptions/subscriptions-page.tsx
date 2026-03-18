import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { type ColumnDef, type SortingState } from '@tanstack/react-table';
import { Eye, ArrowRightLeft } from 'lucide-react';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import {
  DataTableRowActions,
  type RowAction,
} from '@/components/data-table/data-table-row-actions';
import { StatusBadge } from '@/components/status-badge';
import { useSubscriptionsQuery } from './hooks/use-subscriptions';
import { ViewSubscriptionSheet } from './components/view-subscription-sheet';
import { ChangePlanDialog } from './components/change-plan-dialog';
import { RevenueOverview } from './components/revenue-overview';
import type { Subscription } from './types';

function sortingToApiSort(sorting: SortingState): string | undefined {
  if (sorting.length === 0) return undefined;
  return sorting.map((s) => (s.desc ? `-${s.id}` : s.id)).join(',');
}

export function SubscriptionsPage() {
  const { t } = useTranslation();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sorting, setSorting] = useState<SortingState>([]);

  const [viewSubscription, setViewSubscription] =
    useState<Subscription | null>(null);
  const [changePlanSubscription, setChangePlanSubscription] =
    useState<Subscription | null>(null);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, sorting]);

  const { data, isLoading } = useSubscriptionsQuery({
    page,
    pageSize,
    status: statusFilter,
    sort: sortingToApiSort(sorting),
  });

  const columns = useMemo<ColumnDef<Subscription, unknown>[]>(
    () => [
      {
        accessorKey: 'tenant',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('subscriptions.tenantName')}
          />
        ),
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.tenant?.name ?? '—'}
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'plan',
        header: () => t('subscriptions.plan'),
        cell: ({ row }) => (
          <span>{row.original.plan?.name ?? '—'}</span>
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
        accessorKey: 'startDate',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('subscriptions.startDate')}
          />
        ),
        cell: ({ row }) => (
          <span>
            {format(new Date(row.getValue('startDate')), 'MMM d, yyyy')}
          </span>
        ),
      },
      {
        accessorKey: 'endDate',
        header: () => t('subscriptions.endDate'),
        cell: ({ row }) => {
          const endDate = row.getValue('endDate') as string | undefined;
          return (
            <span>
              {endDate
                ? format(new Date(endDate), 'MMM d, yyyy')
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
          const subscription = row.original;
          const actions: RowAction[] = [
            {
              label: t('common.view'),
              icon: Eye,
              onClick: () => setViewSubscription(subscription),
            },
            {
              label: t('subscriptions.changePlan'),
              icon: ArrowRightLeft,
              onClick: () => setChangePlanSubscription(subscription),
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
    { label: t('subscriptions.cancelled'), value: 'cancelled' },
    { label: t('subscriptions.expired'), value: 'expired' },
    { label: t('common.pending'), value: 'pending' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          {t('subscriptions.title')}
        </h1>
      </div>

      <Tabs defaultValue="subscriptions">
        <TabsList>
          <TabsTrigger value="subscriptions">
            {t('subscriptions.subscriptionsList')}
          </TabsTrigger>
          <TabsTrigger value="revenue">
            {t('subscriptions.revenue')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="mt-6">
          <RevenueOverview />
        </TabsContent>

        <TabsContent value="subscriptions" className="mt-6">

      <DataTableToolbar
        searchValue=""
        onSearchChange={() => {}}
        searchPlaceholder=""
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

      <ViewSubscriptionSheet
        open={!!viewSubscription}
        onOpenChange={(open) => !open && setViewSubscription(null)}
        subscription={viewSubscription}
      />
      <ChangePlanDialog
        open={!!changePlanSubscription}
        onOpenChange={(open) => !open && setChangePlanSubscription(null)}
        subscription={changePlanSubscription}
      />

        </TabsContent>
      </Tabs>
    </div>
  );
}
