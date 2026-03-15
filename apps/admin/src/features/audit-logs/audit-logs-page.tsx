import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { type ColumnDef, type SortingState } from '@tanstack/react-table';
import { Eye, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import {
  DataTableRowActions,
  type RowAction,
} from '@/components/data-table/data-table-row-actions';
import { useAuditLogsQuery } from './hooks/use-audit-logs';
import { ViewAuditDialog } from './components/view-audit-dialog';
import type { AuditLog } from './types';

function sortingToApiSort(sorting: SortingState): string | undefined {
  if (sorting.length === 0) return undefined;
  return sorting.map((s) => (s.desc ? `-${s.id}` : s.id)).join(',');
}

const actionOptions = ['create', 'update', 'delete', 'login', 'logout'];
const resourceOptions = [
  'tenant',
  'user',
  'role',
  'subscription',
];

export function AuditLogsPage() {
  const { t } = useTranslation();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [actionFilter, setActionFilter] = useState('all');
  const [resourceFilter, setResourceFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'createdAt', desc: true },
  ]);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const [viewAuditLog, setViewAuditLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    setPage(1);
  }, [actionFilter, resourceFilter, dateFrom, dateTo, sorting]);

  const { data, isLoading, dataUpdatedAt } = useAuditLogsQuery(
    {
      page,
      pageSize,
      action: actionFilter,
      resource: resourceFilter,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      sort: sortingToApiSort(sorting),
    },
    autoRefresh ? 10_000 : false,
  );

  const columns = useMemo<ColumnDef<AuditLog, unknown>[]>(
    () => [
      {
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('audit.timestamp')}
          />
        ),
        cell: ({ row }) => (
          <span className="text-sm">
            {format(
              new Date(row.getValue('createdAt')),
              'MMM d, yyyy HH:mm:ss',
            )}
          </span>
        ),
      },
      {
        accessorKey: 'user',
        header: () => t('audit.user'),
        cell: ({ row }) => {
          const user = row.original.user;
          return (
            <div className="flex flex-col">
              <span className="font-medium">{user?.name ?? '—'}</span>
              {user?.email && (
                <span className="text-xs text-muted-foreground">
                  {user.email}
                </span>
              )}
            </div>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: 'action',
        header: () => t('audit.action'),
        cell: ({ row }) => (
          <span className="capitalize">{row.getValue('action')}</span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'resource',
        header: () => t('audit.resource'),
        cell: ({ row }) => (
          <span className="capitalize">{row.getValue('resource')}</span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'details',
        header: () => t('audit.details'),
        cell: ({ row }) => {
          const details = row.original.details;
          if (!details) return <span className="text-muted-foreground">—</span>;
          const text = JSON.stringify(details);
          return (
            <span
              className="max-w-[200px] truncate text-sm text-muted-foreground"
              title={text}
            >
              {text.length > 50 ? `${text.slice(0, 50)}...` : text}
            </span>
          );
        },
        enableSorting: false,
      },
      {
        id: 'actions',
        header: () => t('common.actions'),
        cell: ({ row }) => {
          const auditLog = row.original;
          const actions: RowAction[] = [
            {
              label: t('common.view'),
              icon: Eye,
              onClick: () => setViewAuditLog(auditLog),
            },
          ];
          return <DataTableRowActions actions={actions} />;
        },
        enableSorting: false,
      },
    ],
    [t],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          {t('audit.title')}
        </h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
            <Label htmlFor="auto-refresh" className="text-sm">
              {t('audit.autoRefresh')}
            </Label>
          </div>
          {autoRefresh && (
            <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">
            {t('audit.dateFrom')}
          </Label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-[160px]"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">
            {t('audit.dateTo')}
          </Label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-[160px]"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">
            {t('audit.action')}
          </Label>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              {actionOptions.map((action) => (
                <SelectItem key={action} value={action}>
                  <span className="capitalize">{action}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">
            {t('audit.resource')}
          </Label>
          <Select value={resourceFilter} onValueChange={setResourceFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              {resourceOptions.map((resource) => (
                <SelectItem key={resource} value={resource}>
                  <span className="capitalize">{resource}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {(actionFilter !== 'all' ||
          resourceFilter !== 'all' ||
          dateFrom ||
          dateTo) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setActionFilter('all');
              setResourceFilter('all');
              setDateFrom('');
              setDateTo('');
            }}
          >
            {t('audit.clearFilters')}
          </Button>
        )}
      </div>

      {dataUpdatedAt > 0 && (
        <p className="text-xs text-muted-foreground">
          {t('audit.lastUpdated', {
            time: format(new Date(dataUpdatedAt), 'HH:mm:ss'),
          })}
        </p>
      )}

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

      <ViewAuditDialog
        open={!!viewAuditLog}
        onOpenChange={(open) => !open && setViewAuditLog(null)}
        auditLog={viewAuditLog}
      />
    </div>
  );
}
