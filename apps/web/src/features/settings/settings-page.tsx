import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AccountSettings } from './components/account-settings';
import { NotificationSettings } from './components/notification-settings';

export function SettingsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('settings.title')}</h1>
      </div>

      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger value="account">
            {t('settings.account')}
          </TabsTrigger>
          <TabsTrigger value="notifications">
            {t('settings.notifications')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="mt-6">
          <AccountSettings />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <NotificationSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
