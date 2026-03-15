import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function SubscriptionsPage() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">
        {t('subscriptions.title')}
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>{t('subscriptions.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t('common.comingSoon')}</p>
        </CardContent>
      </Card>
    </div>
  );
}
