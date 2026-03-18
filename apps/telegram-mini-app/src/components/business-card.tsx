import { useTranslation } from 'react-i18next';
import { MapPin, Star, BadgeCheck } from 'lucide-react';
import { hapticFeedback } from '@/lib/telegram';

interface BusinessCardProps {
  business: {
    id: string;
    tenant: { name: string; slug: string };
    tagline?: string | null;
    coverImage?: string | null;
    city?: string | null;
    country?: string | null;
    isVerified?: boolean;
    averageRating?: number | null;
    reviewCount?: number;
    categories?: Array<{ category: { name: string; slug: string } }>;
  };
  onClick: (slug: string) => void;
}

export function BusinessCard({ business, onClick }: BusinessCardProps) {
  const { t } = useTranslation();

  const handleClick = () => {
    hapticFeedback('light');
    onClick(business.tenant.slug);
  };

  return (
    <button
      onClick={handleClick}
      className="w-full text-start rounded-xl bg-[var(--tg-theme-secondary-bg-color,var(--card))] overflow-hidden shadow-sm active:scale-[0.98] transition-transform"
    >
      {business.coverImage && (
        <div className="h-32 w-full overflow-hidden">
          <img
            src={business.coverImage}
            alt={business.tenant.name}
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <div className="p-3">
        <div className="flex items-center gap-1.5">
          <h3 className="font-semibold text-[var(--tg-theme-text-color,var(--foreground))] truncate">
            {business.tenant.name}
          </h3>
          {business.isVerified && (
            <BadgeCheck className="h-4 w-4 shrink-0 text-[var(--tg-theme-link-color,var(--primary))]" />
          )}
        </div>

        {business.tagline && (
          <p className="text-sm text-[var(--tg-theme-hint-color,var(--muted-foreground))] mt-0.5 truncate">
            {business.tagline}
          </p>
        )}

        <div className="flex items-center gap-3 mt-2 text-xs text-[var(--tg-theme-hint-color,var(--muted-foreground))]">
          {business.city && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {business.city}
            </span>
          )}
          {business.averageRating && business.averageRating > 0 && (
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {business.averageRating.toFixed(1)}
              {business.reviewCount ? ` (${business.reviewCount})` : ''}
            </span>
          )}
        </div>

        {business.categories && business.categories.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {business.categories.slice(0, 3).map((pc) => (
              <span
                key={pc.category.slug}
                className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--tg-theme-bg-color,var(--muted))] text-[var(--tg-theme-hint-color,var(--muted-foreground))]"
              >
                {pc.category.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}
