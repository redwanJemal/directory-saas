import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Upload, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/status-badge';
import { DataTable, DataTableToolbar } from '@/components/data-table';
import { RSVPSummary } from './components/rsvp-summary';
import { AddGuestDialog } from './components/add-guest-dialog';
import { ImportCsvDialog } from './components/import-csv-dialog';
import { useGuests, useDeleteGuest } from './hooks/use-guests';
import type { Guest } from './types';

export function GuestListPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [rsvpFilter, setRsvpFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [sideFilter, setSideFilter] = useState('all');
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const deleteGuest = useDeleteGuest();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, rsvpFilter, groupFilter, sideFilter]);

  const { data, isLoading, error, refetch } = useGuests({
    page,
    pageSize,
    search: debouncedSearch,
    rsvp: rsvpFilter,
    group: groupFilter,
    side: sideFilter,
  });

  const guests = data?.data ?? [];
  const pagination = data?.pagination;

  function handleDelete(id: string) {
    deleteGuest.mutate(id, {
      onError: () => toast.error(t('errors.serverError')),
    });
  }

  const columns: ColumnDef<Guest>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: t('guestList.name'),
      },
      {
        accessorKey: 'group',
        header: t('guestList.group'),
        cell: ({ row }) => (
          <span className="capitalize">{row.original.group}</span>
        ),
      },
      {
        accessorKey: 'side',
        header: t('guestList.side'),
        cell: ({ row }) => (
          <span className="capitalize">{row.original.side}</span>
        ),
      },
      {
        accessorKey: 'rsvp',
        header: t('guestList.rsvp'),
        cell: ({ row }) => (
          <StatusBadge status={row.original.rsvp} />
        ),
      },
      {
        accessorKey: 'mealChoice',
        header: t('guestList.meal'),
        cell: ({ row }) => row.original.mealChoice ?? '-',
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={() => handleDelete(row.original.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    [t],
  );

  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="py-12 text-center space-y-4">
        <p className="text-destructive">{t('common.errorOccurred')}</p>
        <Button variant="outline" onClick={() => refetch()}>
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t('guestList.title')}</h1>

      <RSVPSummary guests={guests} />

      <DataTableToolbar
        searchValue={search}
        onSearchChange={setSearch}
        filters={[
          {
            key: 'rsvp',
            label: t('guestList.rsvp'),
            value: rsvpFilter,
            onChange: setRsvpFilter,
            options: [
              { label: t('guestList.attending'), value: 'attending' },
              { label: t('guestList.declined'), value: 'declined' },
              { label: t('guestList.pending'), value: 'pending' },
            ],
          },
          {
            key: 'group',
            label: t('guestList.group'),
            value: groupFilter,
            onChange: setGroupFilter,
            options: [
              { label: t('guestList.family'), value: 'family' },
              { label: t('guestList.friends'), value: 'friends' },
              { label: t('guestList.colleagues'), value: 'colleagues' },
            ],
          },
          {
            key: 'side',
            label: t('guestList.side'),
            value: sideFilter,
            onChange: setSideFilter,
            options: [
              { label: t('guestList.bride'), value: 'bride' },
              { label: t('guestList.groom'), value: 'groom' },
              { label: t('guestList.mutual'), value: 'mutual' },
            ],
          },
        ]}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              {t('guestList.importCsv')}
            </Button>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('guestList.addGuest')}
            </Button>
          </>
        }
      />

      <DataTable
        columns={columns}
        data={guests}
        page={page}
        pageSize={pageSize}
        totalCount={pagination?.totalCount ?? 0}
        pageCount={pagination?.totalPages ?? 0}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        isLoading={isLoading}
      />

      <AddGuestDialog open={addOpen} onOpenChange={setAddOpen} />
      <ImportCsvDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}
