import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { type ColumnDef } from '@tanstack/react-table';
import { Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { DataTableRowActions, type RowAction } from '@/components/data-table/data-table-row-actions';
import { useVerificationsQuery } from './hooks/use-verifications';
import { ReviewVerificationDialog } from './components/review-verification-dialog';
import type { VerificationRequest } from './types';

export function VerificationsPage() {
  const { t } = useTranslation();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedVerification, setSelectedVerification] =
    useState<VerificationRequest | null>(null);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const { data, isLoading } = useVerificationsQuery({
    page,
    pageSize,
    status: statusFilter,
  });

  const columns = useMemo<ColumnDef<VerificationRequest, unknown>[]>(
    () => [
      {
        accessorKey: 'business',
        header: () => t('verifications.business'),
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.providerProfile?.tenant?.name ?? '—'}
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'createdAt',
        header: () => t('verifications.submittedAt'),
        cell: ({ row }) => (
          <span>
            {new Date(row.original.createdAt).toLocaleDateString()}
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'status',
        header: () => t('common.status'),
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <Badge
              variant={
                status === 'pending'
                  ? 'secondary'
                  : status === 'approved'
                    ? 'default'
                    : 'destructive'
              }
            >
              {t(`verifications.status_${status}`)}
            </Badge>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: 'documents',
        header: () => t('verifications.documents'),
        cell: ({ row }) => {
          const docs = row.original.documentUrls || [];
          const hasLicense = !!row.original.tradeLicenseUrl;
          const total = docs.length + (hasLicense ? 1 : 0);
          return <span>{total}</span>;
        },
        enableSorting: false,
      },
      {
        id: 'actions',
        header: () => t('common.actions'),
        cell: ({ row }) => {
          const actions: RowAction[] = [
            {
              label: t('common.view'),
              icon: Eye,
              onClick: () => setSelectedVerification(row.original),
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
    { label: t('common.pending'), value: 'pending' },
    { label: t('verifications.status_approved'), value: 'approved' },
    { label: t('verifications.status_rejected'), value: 'rejected' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">
        {t('verifications.title')}
      </h1>

      <DataTableToolbar
        searchValue=""
        onSearchChange={() => {}}
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
        isLoading={isLoading}
      />

      <ReviewVerificationDialog
        open={!!selectedVerification}
        onOpenChange={(open) => !open && setSelectedVerification(null)}
        verification={selectedVerification}
      />
    </div>
  );
}
