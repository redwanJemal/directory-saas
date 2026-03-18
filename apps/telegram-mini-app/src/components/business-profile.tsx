import { useTranslation } from 'react-i18next';
import {
  MapPin,
  Star,
  BadgeCheck,
  Phone,
  MessageCircle,
  Globe,
  Share2,
  Clock,
} from 'lucide-react';
import { shareBusiness, hapticFeedback } from '@/lib/telegram';
import { LoadingSpinner } from './loading-spinner';
import { useBusinessProfile } from '@/hooks/use-businesses';

interface BusinessProfileProps {
  vendorId: string;
  onBack: () => void;
}

export function BusinessProfile({ vendorId, onBack }: BusinessProfileProps) {
  const { t } = useTranslation();
  const { data, isLoading, error } = useBusinessProfile(vendorId);

  if (isLoading) return <LoadingSpinner />;
  if (error || !data?.data) {
    return (
      <div className="flex flex-col items-center py-12 text-[var(--tg-theme-hint-color,var(--muted-foreground))]">
        <p>{t('common.error')}</p>
        <button onClick={onBack} className="mt-2 text-[var(--tg-theme-link-color,var(--primary))]">
          {t('common.back')}
        </button>
      </div>
    );
  }

  const profile = data.data;
  const categories = profile.categories?.map((pc: { category: { name: string } }) => pc.category.name).join(', ') ?? '';

  return (
    <div className="pb-20">
      {/* Cover */}
      {profile.coverImage && (
        <div className="h-48 w-full overflow-hidden">
          <img src={profile.coverImage} alt={profile.tenant?.name} className="h-full w-full object-cover" />
        </div>
      )}

      {/* Header */}
      <div className="p-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-[var(--tg-theme-text-color,var(--foreground))]">
            {profile.tenant?.name}
          </h1>
          {profile.isVerified && (
            <BadgeCheck className="h-5 w-5 text-[var(--tg-theme-link-color,var(--primary))]" />
          )}
        </div>

        {profile.tagline && (
          <p className="text-sm text-[var(--tg-theme-hint-color,var(--muted-foreground))] mt-1">
            {profile.tagline}
          </p>
        )}

        <div className="flex items-center gap-4 mt-3 text-sm text-[var(--tg-theme-hint-color,var(--muted-foreground))]">
          {profile.city && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {profile.city}{profile.country ? `, ${profile.country}` : ''}
            </span>
          )}
          {profile.averageRating > 0 && (
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              {profile.averageRating.toFixed(1)}
              {profile.reviewCount ? ` (${profile.reviewCount})` : ''}
            </span>
          )}
        </div>

        {categories && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {profile.categories?.map((pc: { category: { name: string; slug: string } }) => (
              <span
                key={pc.category.slug}
                className="text-xs px-2 py-1 rounded-full bg-[var(--tg-theme-secondary-bg-color,var(--muted))] text-[var(--tg-theme-hint-color,var(--muted-foreground))]"
              >
                {pc.category.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Contact Bar */}
      <div className="flex gap-2 px-4 pb-4">
        {profile.whatsapp && (
          <a
            href={`https://wa.me/${profile.whatsapp.replace(/[^0-9]/g, '')}`}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 text-white text-sm font-medium"
            onClick={() => hapticFeedback('medium')}
          >
            <MessageCircle className="h-4 w-4" />
            {t('common.whatsapp')}
          </a>
        )}
        {profile.phone && (
          <a
            href={`tel:${profile.phone}`}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--tg-theme-button-color,var(--primary))] text-[var(--tg-theme-button-text-color,white)] text-sm font-medium"
            onClick={() => hapticFeedback('medium')}
          >
            <Phone className="h-4 w-4" />
            {t('common.call')}
          </a>
        )}
        <button
          onClick={() => {
            hapticFeedback('medium');
            shareBusiness(profile.tenant?.name, profile.tenant?.slug);
          }}
          className="flex items-center justify-center p-2.5 rounded-xl bg-[var(--tg-theme-secondary-bg-color,var(--card))]"
        >
          <Share2 className="h-4 w-4 text-[var(--tg-theme-text-color,var(--foreground))]" />
        </button>
      </div>

      {/* About */}
      {profile.description && (
        <div className="px-4 pb-4">
          <h2 className="font-semibold text-[var(--tg-theme-text-color,var(--foreground))] mb-2">
            {t('business.about')}
          </h2>
          <p className="text-sm text-[var(--tg-theme-hint-color,var(--muted-foreground))] whitespace-pre-line">
            {profile.description}
          </p>
        </div>
      )}

      {/* Business Hours */}
      {profile.businessHours && Object.keys(profile.businessHours).length > 0 && (
        <div className="px-4 pb-4">
          <h2 className="font-semibold text-[var(--tg-theme-text-color,var(--foreground))] mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {t('business.hours')}
          </h2>
          <div className="space-y-1 text-sm">
            {Object.entries(profile.businessHours as Record<string, { open: string; close: string }>).map(([day, hours]) => (
              <div key={day} className="flex justify-between text-[var(--tg-theme-hint-color,var(--muted-foreground))]">
                <span className="capitalize">{day}</span>
                <span>{hours.open} - {hours.close}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Packages */}
      {profile.packages && profile.packages.length > 0 && (
        <div className="px-4 pb-4">
          <h2 className="font-semibold text-[var(--tg-theme-text-color,var(--foreground))] mb-2">
            {t('business.packages')}
          </h2>
          <div className="space-y-2">
            {profile.packages.map((pkg: { id: string; name: string; description?: string; price?: string }) => (
              <div key={pkg.id} className="p-3 rounded-xl bg-[var(--tg-theme-secondary-bg-color,var(--card))]">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm text-[var(--tg-theme-text-color,var(--foreground))]">
                    {pkg.name}
                  </span>
                  {pkg.price && (
                    <span className="text-sm font-semibold text-[var(--tg-theme-link-color,var(--primary))]">
                      ${pkg.price}
                    </span>
                  )}
                </div>
                {pkg.description && (
                  <p className="text-xs text-[var(--tg-theme-hint-color,var(--muted-foreground))] mt-1">
                    {pkg.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Website */}
      {profile.website && (
        <div className="px-4 pb-4">
          <a
            href={profile.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-[var(--tg-theme-link-color,var(--primary))]"
          >
            <Globe className="h-4 w-4" />
            {profile.website.replace(/^https?:\/\//, '')}
          </a>
        </div>
      )}
    </div>
  );
}
