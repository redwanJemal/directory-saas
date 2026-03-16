import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SendQuoteSchema, type SendQuoteDto } from '../schemas';
import { useSendQuote } from '../hooks/use-bookings';

interface SendQuoteDialogProps {
  bookingId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SendQuoteDialog({
  bookingId,
  open,
  onOpenChange,
}: SendQuoteDialogProps) {
  const { t } = useTranslation();
  const sendQuote = useSendQuote();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<Partial<SendQuoteDto>>({
    amount: undefined,
    description: '',
    validUntil: '',
    notes: '',
  });

  function handleChange(field: keyof SendQuoteDto, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  }

  async function handleSubmit() {
    const result = SendQuoteSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (!bookingId) return;

    try {
      await sendQuote.mutateAsync({ bookingId, dto: result.data });
      toast.success(t('bookings.quoteSent'));
      onOpenChange(false);
      setForm({ amount: undefined, description: '', validUntil: '', notes: '' });
      setErrors({});
    } catch {
      toast.error(t('errors.serverError'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('bookings.sendQuote')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">{t('bookings.amount')}</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={form.amount ?? ''}
              onChange={(e) => handleChange('amount', e.target.value)}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('bookings.quoteDescription')}</Label>
            <Textarea
              id="description"
              rows={4}
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="validUntil">{t('bookings.validUntilLabel')}</Label>
            <Input
              id="validUntil"
              type="date"
              value={form.validUntil}
              onChange={(e) => handleChange('validUntil', e.target.value)}
            />
            {errors.validUntil && (
              <p className="text-sm text-destructive">{errors.validUntil}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t('bookings.notes')}</Label>
            <Textarea
              id="notes"
              rows={2}
              value={form.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={sendQuote.isPending}>
            {sendQuote.isPending ? t('common.loading') : t('bookings.sendQuote')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
