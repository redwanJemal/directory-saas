import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useHealthQuery } from './hooks/use-settings';

function PlatformSettingsTab() {
  const { t } = useTranslation();
  const [appName, setAppName] = useState('Directory SaaS');
  const [supportEmail, setSupportEmail] = useState('support@example.com');
  const [isSaving, setIsSaving] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success(t('settings.saved'));
    }, 500);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.platform')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="app-name">{t('settings.appName')}</Label>
            <Input
              id="app-name"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="support-email">
              {t('settings.supportEmail')}
            </Label>
            <Input
              id="support-email"
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? t('common.loading') : t('common.save')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ServiceStatus({
  name,
  status,
}: {
  name: string;
  status: 'up' | 'down' | 'unknown';
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium capitalize">{name}</span>
      <div className="flex items-center gap-2">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            status === 'up'
              ? 'bg-green-500'
              : status === 'down'
                ? 'bg-red-500'
                : 'bg-muted-foreground'
          }`}
        />
        <span
          className={`text-sm ${
            status === 'up'
              ? 'text-green-600 dark:text-green-400'
              : status === 'down'
                ? 'text-red-600 dark:text-red-400'
                : 'text-muted-foreground'
          }`}
        >
          {status === 'up' ? 'Healthy' : status === 'down' ? 'Unhealthy' : 'Unknown'}
        </span>
      </div>
    </div>
  );
}

function SystemHealthTab() {
  const { t } = useTranslation();
  const { data: health, isLoading, dataUpdatedAt } = useHealthQuery();

  const services = ['database', 'redis', 'meilisearch', 'storage'];

  function getServiceStatus(name: string): 'up' | 'down' | 'unknown' {
    if (!health) return 'unknown';
    const info = health.info?.[name] ?? health.details?.[name];
    if (info?.status === 'up') return 'up';
    const error = health.error?.[name];
    if (error) return 'down';
    return 'unknown';
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.systemHealth')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {services.map((s) => (
              <Skeleton key={s} className="h-8 w-full" />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {services.map((service) => (
              <ServiceStatus
                key={service}
                name={service}
                status={getServiceStatus(service)}
              />
            ))}
          </div>
        )}
        {dataUpdatedAt > 0 && (
          <p className="text-xs text-muted-foreground">
            {t('settings.lastChecked', {
              time: format(new Date(dataUpdatedAt), 'HH:mm:ss'),
            })}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {t('settings.autoRefreshNote')}
        </p>
      </CardContent>
    </Card>
  );
}

function EnvironmentInfoTab() {
  const { t } = useTranslation();

  const envInfo = [
    {
      label: t('settings.environment'),
      value: import.meta.env.MODE ?? 'development',
    },
    { label: t('settings.apiUrl'), value: '/api/v1' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.environmentInfo')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-border">
          {envInfo.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between py-2"
            >
              <span className="text-sm text-muted-foreground">
                {item.label}
              </span>
              <span className="text-sm font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function SettingsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">
        {t('settings.title')}
      </h1>

      <Tabs defaultValue="platform">
        <TabsList>
          <TabsTrigger value="platform">{t('settings.platform')}</TabsTrigger>
          <TabsTrigger value="health">
            {t('settings.systemHealth')}
          </TabsTrigger>
          <TabsTrigger value="environment">
            {t('settings.environmentInfo')}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="platform" className="mt-4">
          <PlatformSettingsTab />
        </TabsContent>
        <TabsContent value="health" className="mt-4">
          <SystemHealthTab />
        </TabsContent>
        <TabsContent value="environment" className="mt-4">
          <EnvironmentInfoTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
