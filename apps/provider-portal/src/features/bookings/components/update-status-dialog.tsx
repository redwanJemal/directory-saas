import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useUpdateBookingStatus } from '../hooks/use-bookings';
import type { BookingStatus } from '../types';

interface UpdateStatusDialogProps {
  bookingId: string | null;
  nextStatus: BookingStatus | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpdateStatusDialog({
  bookingId,
  nextStatus,
  open,
  onOpenChange,
}: UpdateStatusDialogProps) {
  const { t } = useTranslation();
  const updateStatus = useUpdateBookingStatus();
  const [notes, setNotes] = useState('');

  async function handleConfirm() {
    if (!bookingId || !nextStatus) return;

    try {
      await updateStatus.mutateAsync({
        bookingId,
        dto: { status: nextStatus, notes: notes || undefined },
      });
      toast.success(t('bookings.statusUpdated'));
      onOpenChange(false);
      setNotes('');
    } catch {
      toast.error(t('errors.serverError'));
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('bookings.updateStatus')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('bookings.updateStatusConfirm', { status: nextStatus })}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="statusNotes">{t('bookings.notes')}</Label>
          <Textarea
            id="statusNotes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('bookings.notesPlaceholder')}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={updateStatus.isPending}
          >
            {updateStatus.isPending ? t('common.loading') : t('common.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
