import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isToday,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StatusBadge } from '@/components/status-badge';
import { cn } from '@/lib/utils';
import { useCalendarEvents, useBlockDate, useUnblockDate, type CalendarEvent } from './hooks/use-calendar';

export function CalendarPage() {
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const { data: events, isLoading } = useCalendarEvents(year, month);
  const blockDate = useBlockDate();
  const unblockDate = useUnblockDate();

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events?.forEach((event) => {
      const key = event.date.slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    });
    return map;
  }, [events]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);

    const days: Date[] = [];
    let day = calStart;
    while (day <= calEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentDate]);

  function handleDateClick(date: Date) {
    setSelectedDate(date);
    setDetailOpen(true);
  }

  async function handleToggleBlock(dateStr: string, isBlocked: boolean) {
    try {
      if (isBlocked) {
        await unblockDate.mutateAsync(dateStr);
        toast.success(t('calendar.dateUnblocked'));
      } else {
        await blockDate.mutateAsync(dateStr);
        toast.success(t('calendar.dateBlocked'));
      }
    } catch {
      toast.error(t('errors.serverError'));
    }
  }

  const selectedDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  const selectedEvents = selectedDateStr ? (eventsByDate.get(selectedDateStr) ?? []) : [];
  const isSelectedBlocked = selectedEvents.some((e) => e.type === 'blocked');

  const dayHeaders = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('calendar.title')}</h1>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-full bg-primary" />
          <span>{t('calendar.booked')}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-full bg-muted-foreground" />
          <span>{t('calendar.blocked')}</span>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <CardTitle>{format(currentDate, 'MMMM yyyy')}</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              {t('calendar.today')}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-96 flex items-center justify-center text-muted-foreground">
              {t('common.loading')}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
              {dayHeaders.map((day) => (
                <div
                  key={day}
                  className="bg-muted p-2 text-center text-xs font-medium text-muted-foreground"
                >
                  {t(`calendar.${day}`)}
                </div>
              ))}
              {calendarDays.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const dayEvents = eventsByDate.get(dateStr) ?? [];
                const isBlocked = dayEvents.some((e) => e.type === 'blocked');
                const inMonth = isSameMonth(day, currentDate);

                return (
                  <button
                    key={dateStr}
                    className={cn(
                      'bg-background p-2 min-h-[80px] text-left transition-colors hover:bg-accent/50',
                      !inMonth && 'opacity-30',
                      isBlocked && 'bg-muted/50',
                      isToday(day) && 'ring-2 ring-primary ring-inset',
                    )}
                    onClick={() => handleDateClick(day)}
                  >
                    <span className={cn(
                      'text-sm',
                      isToday(day) && 'font-bold text-primary',
                    )}>
                      {format(day, 'd')}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {dayEvents.slice(0, 3).map((event, i) => (
                        <div
                          key={i}
                          className={cn(
                            'text-xs truncate rounded px-1',
                            event.type === 'booking'
                              ? 'bg-primary/10 text-primary'
                              : 'bg-muted text-muted-foreground',
                          )}
                        >
                          {event.title ?? event.clientName ?? event.type}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{dayEvents.length - 3}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedDate ? format(selectedDate, 'PPPP') : ''}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {selectedEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t('calendar.noEventsOnDate')}
              </p>
            ) : (
              <div className="space-y-2">
                {selectedEvents
                  .filter((e) => e.type === 'booking')
                  .map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-3 rounded-md border border-border"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {event.clientName ?? event.title}
                        </p>
                      </div>
                      {event.status && <StatusBadge status={event.status} />}
                    </div>
                  ))}
              </div>
            )}

            <div className="pt-2">
              <Button
                variant={isSelectedBlocked ? 'outline' : 'secondary'}
                size="sm"
                onClick={() => handleToggleBlock(selectedDateStr, isSelectedBlocked)}
                disabled={blockDate.isPending || unblockDate.isPending}
              >
                {isSelectedBlocked ? t('calendar.unblockDate') : t('calendar.blockDate')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
