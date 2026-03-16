import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import type { ApiResponse } from '@/lib/types';

interface NotificationPreferences {
  emailOnNewInquiry: boolean;
  emailOnNewReview: boolean;
  emailOnNewMessage: boolean;
  emailOnBookingStatusChange: boolean;
}

export function NotificationSettings() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    emailOnNewInquiry: true,
    emailOnNewReview: true,
    emailOnNewMessage: true,
    emailOnBookingStatusChange: true,
  });

  const { data } = useQuery({
    queryKey: ['settings', 'notifications'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<NotificationPreferences>>(
        '/settings/notifications',
      );
      return data.data;
    },
  });

  useEffect(() => {
    if (data) setPrefs(data);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (prefs: NotificationPreferences) => {
      await api.patch('/settings/notifications', prefs);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'notifications'] });
      toast.success(t('settings.saved'));
    },
    onError: () => {
      toast.error(t('errors.serverError'));
    },
  });

  function handleToggle(key: keyof NotificationPreferences) {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const options: Array<{ key: keyof NotificationPreferences; label: string }> = [
    { key: 'emailOnNewInquiry', label: t('settings.emailOnNewInquiry') },
    { key: 'emailOnNewReview', label: t('settings.emailOnNewReview') },
    { key: 'emailOnNewMessage', label: t('settings.emailOnNewMessage') },
    { key: 'emailOnBookingStatusChange', label: t('settings.emailOnBookingStatusChange') },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('settings.notificationPreferences')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {options.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between">
            <Label htmlFor={key}>{label}</Label>
            <Switch
              id={key}
              checked={prefs[key]}
              onCheckedChange={() => handleToggle(key)}
            />
          </div>
        ))}
        <div className="pt-2">
          <Button
            onClick={() => saveMutation.mutate(prefs)}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? t('common.loading') : t('common.save')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
