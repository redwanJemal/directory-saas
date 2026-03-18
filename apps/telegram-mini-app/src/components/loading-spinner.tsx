import { useTranslation } from 'react-i18next';

export function LoadingSpinner() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--tg-theme-hint-color,var(--muted-foreground))] border-t-[var(--tg-theme-link-color,var(--primary))]" />
      <p className="mt-3 text-sm text-[var(--tg-theme-hint-color,var(--muted-foreground))]">
        {t('common.loading')}
      </p>
    </div>
  );
}
