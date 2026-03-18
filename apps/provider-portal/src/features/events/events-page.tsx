import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { EventCard } from './components/event-card';
import { EventDialog } from './components/event-dialog';
import {
  useEventsQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
} from './hooks/use-events';
import type { CommunityEvent } from './types';
import type { CreateEventFormData } from './schemas';

export function EventsPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const { data: eventsResponse, isLoading } = useEventsQuery(page);
  const createMutation = useCreateEventMutation();
  const updateMutation = useUpdateEventMutation();
  const deleteMutation = useDeleteEventMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CommunityEvent | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<CommunityEvent | null>(null);

  const events = eventsResponse?.data ?? [];
  const pagination = eventsResponse?.pagination;

  function handleCreate() {
    setEditingEvent(null);
    setDialogOpen(true);
  }

  function handleEdit(event: CommunityEvent) {
    setEditingEvent(event);
    setDialogOpen(true);
  }

  async function handleSubmit(data: CreateEventFormData) {
    try {
      const payload = {
        ...data,
        description: data.description || undefined,
        time: data.time || undefined,
        location: data.location || undefined,
        city: data.city || undefined,
        country: data.country || undefined,
        imageUrl: data.imageUrl || undefined,
      };

      if (editingEvent) {
        await updateMutation.mutateAsync({ id: editingEvent.id, ...payload } as any);
        toast.success(t('events.eventUpdated'));
      } else {
        await createMutation.mutateAsync(payload);
        toast.success(t('events.eventCreated'));
      }
      setDialogOpen(false);
    } catch {
      toast.error(t('errors.serverError'));
    }
  }

  async function handleDelete() {
    if (!deletingEvent) return;
    try {
      await deleteMutation.mutateAsync(deletingEvent.id);
      toast.success(t('events.eventDeleted'));
      setDeletingEvent(null);
    } catch {
      toast.error(t('errors.serverError'));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t('events.title')}</h1>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          {t('events.createEvent')}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground mb-4">{t('events.empty')}</p>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            {t('events.createEvent')}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onEdit={handleEdit}
              onDelete={setDeletingEvent}
            />
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            {t('common.back')}
          </Button>
          <span className="flex items-center text-sm text-muted-foreground">
            {page} / {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            {t('common.next')}
          </Button>
        </div>
      )}

      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        event={editingEvent}
        onSubmit={handleSubmit}
        isPending={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={!!deletingEvent} onOpenChange={() => setDeletingEvent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('events.deleteEventTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('events.deleteEventConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
