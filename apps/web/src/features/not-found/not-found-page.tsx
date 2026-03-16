import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center">
        <FileQuestion className="mx-auto h-16 w-16 text-muted-foreground/50" />
        <h1 className="mt-4 text-4xl font-bold">404</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {t('common.pageNotFound')}
        </p>
        <Button asChild className="mt-6">
          <Link to="/">{t('common.goHome')}</Link>
        </Button>
      </div>
    </div>
  );
}
