import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  addMonths,
  subMonths,
  getDay,
} from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAvailabilityQuery, useUpdateAvailabilityMutation } from '../hooks/use-profile';

export function AvailabilityTab() {
  const { t } = useTranslation();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const monthStr = format(currentMonth, 'yyyy-MM');
  const { data: availability, isLoading } = useAvailabilityQuery(monthStr);
  const updateMutation = useUpdateAvailabilityMutation();

  const [changes, setChanges] = useState<Map<string, 'available' | 'blocked'>>(new Map());
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockStart, setBlockStart] = useState('');
  const [blockEnd, setBlockEnd] = useState('');

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const startDay = getDay(startOfMonth(currentMonth));

  function getStatus(dateStr: string): 'available' | 'booked' | 'blocked' {
    if (changes.has(dateStr)) return changes.get(dateStr)!;
    return availability?.find((a) => a.date === dateStr)?.status ?? 'available';
  }

  function handleDateClick(dateStr: string, currentStatus: string) {
    if (currentStatus === 'booked') return;
    const newStatus = currentStatus === 'available' ? 'blocked' : 'available';
    setChanges((prev) => {
      const next = new Map(prev);
      const original = availability?.find((a) => a.date === dateStr)?.status ?? 'available';
      if (newStatus === original) {
        next.delete(dateStr);
      } else {
        next.set(dateStr, newStatus);
      }
      return next;
    });
  }

  function handleBlockRange() {
    if (!blockStart || !blockEnd) return;
    const start = new Date(blockStart);
    const end = new Date(blockEnd);
    if (start > end) return;

    const rangeDays = eachDayOfInterval({ start, end });
    setChanges((prev) => {
      const next = new Map(prev);
      for (const day of rangeDays) {
        const dateStr = format(day, 'yyyy-MM-dd');
        const current = availability?.find((a) => a.date === dateStr)?.status;
        if (current !== 'booked') {
          next.set(dateStr, 'blocked');
        }
      }
      return next;
    });
    setBlockDialogOpen(false);
    setBlockStart('');
    setBlockEnd('');
  }

  async function handleSave() {
    if (changes.size === 0) return;
    const dates = Array.from(changes.entries()).map(([date, status]) => ({ date, status }));
    try {
      await updateMutation.mutateAsync(dates);
      setChanges(new Map());
      toast.success(t('profile.availabilitySaved'));
    } catch {
      toast.error(t('errors.serverError'));
    }
  }

  const dayHeaders = [
    t('calendar.sun'),
    t('calendar.mon'),
    t('calendar.tue'),
    t('calendar.wed'),
    t('calendar.thu'),
    t('calendar.fri'),
    t('calendar.sat'),
  ];

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth((m) => subMonths(m, 1))}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <CardTitle>{format(currentMonth, 'MMMM yyyy')}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth((m) => addMonths(m, 1))}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {dayHeaders.map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
            {Array.from({ length: startDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {days.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const status = getStatus(dateStr);
              const hasChange = changes.has(dateStr);
              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => handleDateClick(dateStr, status)}
                  disabled={status === 'booked'}
                  className={cn(
                    'aspect-square rounded-md text-sm flex items-center justify-center transition-colors',
                    status === 'available' && 'bg-accent/50 hover:bg-accent text-accent-foreground',
                    status === 'booked' && 'bg-primary/20 cursor-not-allowed text-primary',
                    status === 'blocked' && 'bg-destructive/20 hover:bg-destructive/30 text-destructive',
                    hasChange && 'ring-2 ring-primary',
                  )}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-accent/50" />
              <span>{t('calendar.available')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-primary/20" />
              <span>{t('calendar.booked')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-destructive/20" />
              <span>{t('calendar.blocked')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setBlockDialogOpen(true)}>
          {t('calendar.blockDates')}
        </Button>
        <Button onClick={handleSave} disabled={changes.size === 0 || updateMutation.isPending}>
          {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('common.save')} {changes.size > 0 && `(${changes.size})`}
        </Button>
      </div>

      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('calendar.blockDates')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('calendar.startDate')}</Label>
              <Input type="date" value={blockStart} onChange={(e) => setBlockStart(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('calendar.endDate')}</Label>
              <Input type="date" value={blockEnd} onChange={(e) => setBlockEnd(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleBlockRange} disabled={!blockStart || !blockEnd}>
              {t('common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
