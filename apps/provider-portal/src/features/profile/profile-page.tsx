import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GeneralInfoTab } from './components/general-info-tab';
import { PackagesTab } from './components/packages-tab';
import { FAQsTab } from './components/faqs-tab';
import { AvailabilityTab } from './components/availability-tab';

export function ProfilePage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{t('profile.title')}</h1>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">{t('profile.generalInfo')}</TabsTrigger>
          <TabsTrigger value="packages">{t('profile.packages')}</TabsTrigger>
          <TabsTrigger value="faqs">{t('profile.faqs')}</TabsTrigger>
          <TabsTrigger value="availability">{t('profile.availability')}</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralInfoTab />
        </TabsContent>
        <TabsContent value="packages">
          <PackagesTab />
        </TabsContent>
        <TabsContent value="faqs">
          <FAQsTab />
        </TabsContent>
        <TabsContent value="availability">
          <AvailabilityTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
