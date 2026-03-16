import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { type ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Eye, Send, ArrowRight, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { DataTableRowActions, type RowAction } from '@/components/data-table/data-table-row-actions';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { StatusBadge } from '@/components/status-badge';
import { useBookings } from './hooks/use-bookings';
import { BookingDetailSheet } from './components/booking-detail-sheet';
import { SendQuoteDialog } from './components/send-quote-dialog';
import { UpdateStatusDialog } from './components/update-status-dialog';
import type { Booking, BookingStatus } from './types';
import { BOOKING_TAB_STATUSES, BOOKING_STATUS_TRANSITIONS } from './types';

export function BookingsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');

  const [detailBookingId, setDetailBookingId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [quoteBookingId, setQuoteBookingId] = useState<string | null>(null);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [statusBookingId, setStatusBookingId] = useState<string | null>(null);
  const [nextStatus, setNextStatus] = useState<BookingStatus | null>(null);
  const [statusOpen, setStatusOpen] = useState(false);

  const statusFilter = BOOKING_TAB_STATUSES[activeTab] ?? null;
  const { data, isLoading } = useBookings({ page, pageSize, status: statusFilter, search });

  function openDetail(id: string) {
    setDetailBookingId(id);
    setDetailOpen(true);
  }

  function openQuote(id: string) {
    setQuoteBookingId(id);
    setQuoteOpen(true);
  }

  function openStatusUpdate(id: string, status: BookingStatus) {
    setStatusBookingId(id);
    setNextStatus(status);
    setStatusOpen(true);
  }

  function getActions(booking: Booking): RowAction[] {
    const actions: RowAction[] = [
      { label: t('common.view'), onClick: () => openDetail(booking.id), icon: Eye },
    ];

    const transitions = BOOKING_STATUS_TRANSITIONS[booking.status];

    if (booking.status === 'inquiry') {
      actions.push({
        label: t('bookings.sendQuote'),
        onClick: () => openQuote(booking.id),
        icon: Send,
      });
    }

    for (const next of transitions) {
      if (next === 'cancelled') {
        actions.push({
          label: t('bookings.cancel'),
          onClick: () => openStatusUpdate(booking.id, 'cancelled'),
          icon: XCircle,
          variant: 'destructive',
          separator: true,
        });
      } else if (next !== 'quoted') {
        actions.push({
          label: t(`bookings.markAs_${next}`),
          onClick: () => openStatusUpdate(booking.id, next),
          icon: ArrowRight,
        });
      }
    }

    return actions;
  }

  const columns = useMemo<ColumnDef<Booking, unknown>[]>(
    () => [
      {
        accessorKey: 'clientName',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('bookings.coupleName')} />
        ),
        cell: ({ row }) => (
          <button
            className="font-medium hover:underline text-left"
            onClick={() => openDetail(row.original.id)}
          >
            {row.original.clientName}
          </button>
        ),
      },
      {
        accessorKey: 'eventDate',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('bookings.eventDate')} />
        ),
        cell: ({ row }) => format(new Date(row.original.eventDate), 'PPP'),
      },
      {
        accessorKey: 'status',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('common.status')} />
        ),
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'packageName',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('bookings.package')} />
        ),
        cell: ({ row }) => row.original.packageName ?? '—',
      },
      {
        accessorKey: 'amount',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('bookings.amount')} />
        ),
        cell: ({ row }) =>
          row.original.amount != null
            ? new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'ETB',
              }).format(row.original.amount)
            : '—',
      },
      {
        id: 'actions',
        cell: ({ row }) => <DataTableRowActions actions={getActions(row.original)} />,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, activeTab],
  );

  const tabs = [
    { value: 'all', label: t('bookings.all') },
    { value: 'inquiries', label: t('bookings.inquiries') },
    { value: 'active', label: t('bookings.active') },
    { value: 'completed', label: t('bookings.completed') },
    { value: 'cancelled', label: t('bookings.cancelled') },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('bookings.title')}</h1>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setPage(1); }}>
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader className="pb-3">
          <DataTableToolbar
            searchValue={search}
            onSearchChange={(v) => { setSearch(v); setPage(1); }}
            searchPlaceholder={t('bookings.searchPlaceholder')}
          />
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={data?.data ?? []}
            page={page}
            pageSize={pageSize}
            totalCount={data?.pagination?.totalCount ?? 0}
            pageCount={data?.pagination?.totalPages ?? 0}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      <BookingDetailSheet
        bookingId={detailBookingId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      <SendQuoteDialog
        bookingId={quoteBookingId}
        open={quoteOpen}
        onOpenChange={setQuoteOpen}
      />

      <UpdateStatusDialog
        bookingId={statusBookingId}
        nextStatus={nextStatus}
        open={statusOpen}
        onOpenChange={setStatusOpen}
      />
    </div>
  );
}
