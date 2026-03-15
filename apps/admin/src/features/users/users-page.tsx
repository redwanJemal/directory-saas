import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function UsersPage() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">
        {t('users.title')}
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>{t('users.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t('common.comingSoon')}</p>
        </CardContent>
      </Card>
    </div>
  );
}
