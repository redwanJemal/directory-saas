import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NotificationSettings } from './components/notification-settings';
import { BusinessHours } from './components/business-hours';
import { AccountSettings } from './components/account-settings';

export function SettingsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('settings.title')}</h1>
      </div>

      <Tabs defaultValue="notifications">
        <TabsList>
          <TabsTrigger value="notifications">
            {t('settings.notifications')}
          </TabsTrigger>
          <TabsTrigger value="business-hours">
            {t('settings.businessHours')}
          </TabsTrigger>
          <TabsTrigger value="account">
            {t('settings.account')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="mt-6">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="business-hours" className="mt-6">
          <BusinessHours />
        </TabsContent>

        <TabsContent value="account" className="mt-6">
          <AccountSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
