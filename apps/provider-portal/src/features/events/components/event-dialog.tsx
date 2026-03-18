import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { createEventSchema, type CreateEventFormData } from '../schemas';
import type { CommunityEvent } from '../types';

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: CommunityEvent | null;
  onSubmit: (data: CreateEventFormData) => Promise<void>;
  isPending: boolean;
}

const EMPTY_FORM: CreateEventFormData = {
  title: '',
  description: '',
  date: '',
  time: '',
  location: '',
  city: '',
  country: '',
  imageUrl: '',
  maxAttendees: null,
  eventType: 'business',
};

export function EventDialog({ open, onOpenChange, event, onSubmit, isPending }: EventDialogProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<CreateEventFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (event) {
      setForm({
        title: event.title,
        description: event.description || '',
        date: event.date ? event.date.slice(0, 10) : '',
        time: event.time || '',
        location: event.location || '',
        city: event.city || '',
        country: event.country || '',
        imageUrl: event.imageUrl || '',
        maxAttendees: event.maxAttendees,
        eventType: event.eventType,
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
  }, [event, open]);

  function updateField<K extends keyof CreateEventFormData>(
    key: K,
    value: CreateEventFormData[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const result = createEventSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0]?.toString();
        if (key) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    await onSubmit(result.data);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {event ? t('events.editEvent') : t('events.createEvent')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t('events.eventTitle')}</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('profile.description')}</Label>
            <Textarea
              id="description"
              value={form.description ?? ''}
              onChange={(e) => updateField('description', e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">{t('events.date')}</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => updateField('date', e.target.value)}
              />
              {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">{t('events.time')}</Label>
              <Input
                id="time"
                type="time"
                value={form.time ?? ''}
                onChange={(e) => updateField('time', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">{t('events.location')}</Label>
            <Input
              id="location"
              value={form.location ?? ''}
              onChange={(e) => updateField('location', e.target.value)}
              placeholder={t('events.locationPlaceholder')}
            />
          </div>

          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">{t('profile.city')}</Label>
              <Input
                id="city"
                value={form.city ?? ''}
                onChange={(e) => updateField('city', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">{t('profile.country')}</Label>
              <Input
                id="country"
                value={form.country ?? ''}
                onChange={(e) => updateField('country', e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="maxAttendees">{t('events.maxAttendees')}</Label>
              <Input
                id="maxAttendees"
                type="number"
                min={1}
                value={form.maxAttendees ?? ''}
                onChange={(e) =>
                  updateField('maxAttendees', e.target.value ? Number(e.target.value) : null)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventType">{t('events.eventType')}</Label>
              <Select
                value={form.eventType}
                onValueChange={(v) => updateField('eventType', v as 'business' | 'community')}
              >
                <SelectTrigger id="eventType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="business">{t('events.type_business')}</SelectItem>
                  <SelectItem value="community">{t('events.type_community')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">{t('events.image')}</Label>
            <Input
              id="imageUrl"
              value={form.imageUrl ?? ''}
              onChange={(e) => updateField('imageUrl', e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {event ? t('common.save') : t('common.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
