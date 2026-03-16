import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWedding } from './hooks/use-wedding';
import { WeddingForm } from './components/wedding-form';
import { EventsManager } from './components/events-manager';
import { CollaboratorsManager } from './components/collaborators-manager';

export function WeddingPage() {
  const { t } = useTranslation();
  const { data: wedding, isLoading } = useWedding();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t('wedding.title')}</h1>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">{t('wedding.title')}</TabsTrigger>
          <TabsTrigger value="events">{t('wedding.events')}</TabsTrigger>
          <TabsTrigger value="collaborators">{t('wedding.collaborators')}</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <WeddingForm wedding={wedding} />
        </TabsContent>

        <TabsContent value="events" className="mt-6">
          <EventsManager events={wedding?.events ?? []} />
        </TabsContent>

        <TabsContent value="collaborators" className="mt-6">
          <CollaboratorsManager collaborators={wedding?.collaborators ?? []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
