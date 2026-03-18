import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { type ColumnDef } from '@tanstack/react-table';
import { Eye, EyeOff, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { DataTableRowActions, type RowAction } from '@/components/data-table/data-table-row-actions';
import { toast } from 'sonner';
import { useAdminReviewsQuery, useModerateReviewMutation } from './hooks/use-reviews';
import type { AdminReview } from './types';

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < rating
              ? 'fill-primary text-primary'
              : 'text-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  );
}

export function ReviewsPage() {
  const { t } = useTranslation();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [visibilityFilter, setVisibilityFilter] = useState('all');

  const moderateMutation = useModerateReviewMutation();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, ratingFilter, visibilityFilter]);

  const { data, isLoading } = useAdminReviewsQuery({
    page,
    pageSize,
    rating: ratingFilter,
    isPublic: visibilityFilter,
    search: debouncedSearch || undefined,
  });

  const handleModerate = (review: AdminReview, isPublic: boolean) => {
    moderateMutation.mutate(
      { id: review.id, isPublic },
      {
        onSuccess: () => {
          toast.success(
            isPublic
              ? t('reviews.restored')
              : t('reviews.hidden'),
          );
        },
      },
    );
  };

  const columns = useMemo<ColumnDef<AdminReview, unknown>[]>(
    () => [
      {
        accessorKey: 'client',
        header: () => t('reviews.reviewer'),
        cell: ({ row }) => {
          const client = row.original.client;
          return (
            <span className="font-medium">
              {client?.firstName} {client?.lastName}
            </span>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: 'tenant',
        header: () => t('reviews.business'),
        cell: ({ row }) => (
          <span>{row.original.tenant?.name ?? '—'}</span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'rating',
        header: () => t('reviews.rating'),
        cell: ({ row }) => <RatingStars rating={row.original.rating} />,
        enableSorting: false,
      },
      {
        accessorKey: 'comment',
        header: () => t('reviews.comment'),
        cell: ({ row }) => {
          const comment = row.original.comment;
          if (!comment) return <span className="text-muted-foreground">—</span>;
          return (
            <span className="max-w-[300px] truncate block" title={comment}>
              {comment}
            </span>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: 'createdAt',
        header: () => t('reviews.date'),
        cell: ({ row }) => (
          <span>
            {new Date(row.original.createdAt).toLocaleDateString()}
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'isPublic',
        header: () => t('reviews.visibility'),
        cell: ({ row }) => (
          <Badge variant={row.original.isPublic ? 'default' : 'destructive'}>
            {row.original.isPublic
              ? t('reviews.visible')
              : t('reviews.hiddenLabel')}
          </Badge>
        ),
        enableSorting: false,
      },
      {
        id: 'actions',
        header: () => t('common.actions'),
        cell: ({ row }) => {
          const review = row.original;
          const actions: RowAction[] = review.isPublic
            ? [
                {
                  label: t('reviews.hide'),
                  icon: EyeOff,
                  onClick: () => handleModerate(review, false),
                  variant: 'destructive',
                },
              ]
            : [
                {
                  label: t('reviews.restore'),
                  icon: Eye,
                  onClick: () => handleModerate(review, true),
                },
              ];
          return <DataTableRowActions actions={actions} />;
        },
        enableSorting: false,
      },
    ],
    [t, moderateMutation.isPending],
  );

  const ratingOptions = [
    { label: '1', value: '1' },
    { label: '2', value: '2' },
    { label: '3', value: '3' },
    { label: '4', value: '4' },
    { label: '5', value: '5' },
  ];

  const visibilityOptions = [
    { label: t('reviews.visible'), value: 'true' },
    { label: t('reviews.hiddenLabel'), value: 'false' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">
        {t('reviews.title')}
      </h1>

      <DataTableToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('reviews.searchPlaceholder')}
        filters={[
          {
            key: 'rating',
            label: t('reviews.rating'),
            options: ratingOptions,
            value: ratingFilter,
            onChange: setRatingFilter,
          },
          {
            key: 'visibility',
            label: t('reviews.visibility'),
            options: visibilityOptions,
            value: visibilityFilter,
            onChange: setVisibilityFilter,
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
    </div>
  );
}
