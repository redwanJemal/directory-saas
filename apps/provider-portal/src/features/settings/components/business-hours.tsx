import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import type { ApiResponse } from '@/lib/types';

interface DayHours {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

type BusinessHoursMap = Record<string, DayHours>;

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

const TIMES = Array.from({ length: 48 }, (_, i) => {
  const hours = Math.floor(i / 2);
  const minutes = i % 2 === 0 ? '00' : '30';
  return `${String(hours).padStart(2, '0')}:${minutes}`;
});

const DEFAULT_HOURS: BusinessHoursMap = Object.fromEntries(
  DAYS.map((day) => [
    day,
    {
      isOpen: day !== 'sunday',
      openTime: '09:00',
      closeTime: '17:00',
    },
  ]),
);

export function BusinessHours() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [hours, setHours] = useState<BusinessHoursMap>(DEFAULT_HOURS);

  const { data } = useQuery({
    queryKey: ['settings', 'business-hours'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<BusinessHoursMap>>(
        '/settings/business-hours',
      );
      return data.data;
    },
  });

  useEffect(() => {
    if (data) setHours(data);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (hours: BusinessHoursMap) => {
      await api.patch('/settings/business-hours', hours);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'business-hours'] });
      toast.success(t('settings.saved'));
    },
    onError: () => {
      toast.error(t('errors.serverError'));
    },
  });

  function handleToggleDay(day: string) {
    setHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], isOpen: !prev[day].isOpen },
    }));
  }

  function handleTimeChange(day: string, field: 'openTime' | 'closeTime', value: string) {
    setHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('settings.businessHours')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {DAYS.map((day) => {
          const dayHours = hours[day];
          return (
            <div key={day} className="flex items-center gap-4">
              <div className="flex items-center gap-2 w-32">
                <Checkbox
                  id={`day-${day}`}
                  checked={dayHours?.isOpen ?? false}
                  onCheckedChange={() => handleToggleDay(day)}
                />
                <Label htmlFor={`day-${day}`} className="capitalize text-sm">
                  {t(`settings.day_${day}`)}
                </Label>
              </div>

              {dayHours?.isOpen ? (
                <div className="flex items-center gap-2">
                  <Select
                    value={dayHours.openTime}
                    onValueChange={(v) => handleTimeChange(day, 'openTime', v)}
                  >
                    <SelectTrigger className="w-24 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMES.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">—</span>
                  <Select
                    value={dayHours.closeTime}
                    onValueChange={(v) => handleTimeChange(day, 'closeTime', v)}
                  >
                    <SelectTrigger className="w-24 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMES.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {t('settings.closed')}
                </span>
              )}
            </div>
          );
        })}

        <div className="pt-2">
          <Button
            onClick={() => saveMutation.mutate(hours)}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? t('common.loading') : t('common.save')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
