import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Plus, Trash2, Calendar, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CreateEventSchema } from '../schemas';
import { useAddEvent, useDeleteEvent } from '../hooks/use-wedding';
import type { WeddingEvent } from '../types';

interface EventsManagerProps {
  events: WeddingEvent[];
}

export function EventsManager({ events }: EventsManagerProps) {
  const { t } = useTranslation();
  const addEvent = useAddEvent();
  const deleteEvent = useDeleteEvent();
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: '',
    date: '',
    time: '',
    venue: '',
    notes: '',
  });

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  }

  function handleSubmit() {
    const payload = {
      name: form.name,
      date: form.date,
      time: form.time || undefined,
      venue: form.venue || undefined,
      notes: form.notes || undefined,
    };

    const result = CreateEventSchema.safeParse(payload);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    addEvent.mutate(result.data, {
      onSuccess: () => {
        toast.success(t('common.save'));
        setOpen(false);
        setForm({ name: '', date: '', time: '', venue: '', notes: '' });
        setErrors({});
      },
      onError: () => toast.error(t('errors.serverError')),
    });
  }

  function handleDelete(eventId: string) {
    deleteEvent.mutate(eventId, {
      onError: () => toast.error(t('errors.serverError')),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{t('wedding.events')}</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              {t('common.create')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('wedding.events')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('guestList.name')}</Label>
                <Input value={form.name} onChange={(e) => handleChange('name', e.target.value)} />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('wedding.weddingDate')}</Label>
                  <Input type="date" value={form.date} onChange={(e) => handleChange('date', e.target.value)} />
                  {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
                </div>
                <div className="space-y-2">
                  <Label>{t('checklist.dueDate')}</Label>
                  <Input type="time" value={form.time} onChange={(e) => handleChange('time', e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('wedding.venue')}</Label>
                <Input value={form.venue} onChange={(e) => handleChange('venue', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t('vendor.message')}</Label>
                <Textarea value={form.notes} onChange={(e) => handleChange('notes', e.target.value)} rows={3} />
              </div>
              <Button onClick={handleSubmit} disabled={addEvent.isPending} className="w-full">
                {addEvent.isPending ? t('common.loading') : t('common.save')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('common.noResults')}</p>
      ) : (
        <div className="grid gap-3">
          {events.map((event) => (
            <Card key={event.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <CardHeader className="p-0">
                      <CardTitle className="text-sm">{event.name}</CardTitle>
                    </CardHeader>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(event.date), 'MMM d, yyyy')}
                        {event.time && ` ${event.time}`}
                      </span>
                      {event.venue && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.venue}
                        </span>
                      )}
                    </div>
                    {event.notes && (
                      <p className="text-xs text-muted-foreground mt-1">{event.notes}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleDelete(event.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
