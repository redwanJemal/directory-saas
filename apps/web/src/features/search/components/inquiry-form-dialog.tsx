import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { api } from '@/lib/api';

const inquirySchema = z.object({
  eventDate: z.string().min(1),
  guestCount: z.number().min(1),
  budgetRange: z.string().min(1),
  message: z.string().min(10).max(2000),
});

interface InquiryFormDialogProps {
  vendorId: string;
  vendorName: string;
  packageId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InquiryFormDialog({
  vendorId,
  vendorName,
  packageId,
  open,
  onOpenChange,
}: InquiryFormDialogProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventDate, setEventDate] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [budgetRange, setBudgetRange] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = inquirySchema.safeParse({
      eventDate,
      guestCount: Number(guestCount),
      budgetRange,
      message,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[String(err.path[0])] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/inquiries', {
        vendorId,
        packageId,
        ...parsed.data,
      });
      toast.success(t('vendor.inquirySent'));
      onOpenChange(false);
      setEventDate('');
      setGuestCount('');
      setBudgetRange('');
      setMessage('');
    } catch {
      toast.error(t('errors.serverError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t('vendor.inquiryForm')} — {vendorName}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="eventDate">{t('vendor.eventDate')}</Label>
            <Input
              id="eventDate"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
            {errors.eventDate && (
              <p className="text-sm text-destructive">{errors.eventDate}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="guestCount">{t('vendor.guestCount')}</Label>
            <Input
              id="guestCount"
              type="number"
              min={1}
              value={guestCount}
              onChange={(e) => setGuestCount(e.target.value)}
            />
            {errors.guestCount && (
              <p className="text-sm text-destructive">{errors.guestCount}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t('vendor.budgetRange')}</Label>
            <Select value={budgetRange} onValueChange={setBudgetRange}>
              <SelectTrigger>
                <SelectValue placeholder={t('vendor.budgetRange')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="under-1000">{'< $1,000'}</SelectItem>
                <SelectItem value="1000-5000">$1,000 – $5,000</SelectItem>
                <SelectItem value="5000-10000">$5,000 – $10,000</SelectItem>
                <SelectItem value="10000-25000">$10,000 – $25,000</SelectItem>
                <SelectItem value="over-25000">{'>$25,000'}</SelectItem>
              </SelectContent>
            </Select>
            {errors.budgetRange && (
              <p className="text-sm text-destructive">{errors.budgetRange}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">{t('vendor.message')}</Label>
            <Textarea
              id="message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            {errors.message && (
              <p className="text-sm text-destructive">{errors.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? t('common.loading') : t('vendor.sendInquiry')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
