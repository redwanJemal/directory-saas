import { useTranslation } from 'react-i18next';
import { Tag, MapPin } from 'lucide-react';
import { hapticFeedback } from '@/lib/telegram';

interface DealCardProps {
  deal: {
    id: string;
    title: string;
    description?: string | null;
    discountPercent?: number | null;
    expiresAt?: string | null;
    providerProfile: {
      tenant: { name: string; slug: string };
      city?: string | null;
    };
  };
  onBusinessClick: (slug: string) => void;
}

export function DealCard({ deal, onBusinessClick }: DealCardProps) {
  const { t } = useTranslation();

  return (
    <button
      onClick={() => {
        hapticFeedback('light');
        onBusinessClick(deal.providerProfile.tenant.slug);
      }}
      className="w-full text-start p-3 rounded-xl bg-[var(--tg-theme-secondary-bg-color,var(--card))] active:scale-[0.98] transition-transform"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-[var(--tg-theme-text-color,var(--foreground))] truncate">
            {deal.title}
          </h3>
          <p className="text-xs text-[var(--tg-theme-hint-color,var(--muted-foreground))] mt-0.5">
            {deal.providerProfile.tenant.name}
          </p>
        </div>
        {deal.discountPercent && (
          <span className="shrink-0 flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-red-100 text-red-700">
            <Tag className="h-3 w-3" />
            {t('deals.off', { percent: deal.discountPercent })}
          </span>
        )}
      </div>

      {deal.description && (
        <p className="text-xs text-[var(--tg-theme-hint-color,var(--muted-foreground))] mt-1.5 line-clamp-2">
          {deal.description}
        </p>
      )}

      <div className="flex items-center gap-3 mt-2 text-[10px] text-[var(--tg-theme-hint-color,var(--muted-foreground))]">
        {deal.providerProfile.city && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {deal.providerProfile.city}
          </span>
        )}
        {deal.expiresAt && (
          <span>{t('deals.expires', { date: new Date(deal.expiresAt).toLocaleDateString() })}</span>
        )}
      </div>
    </button>
  );
}
