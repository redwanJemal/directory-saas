import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Seo } from '@/lib/seo';
import { MapPin, ChevronRight, Home, Globe } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCountries, useCities } from '@/features/search/hooks/use-search';
import type { Country } from '@/features/search/types';

export function CitiesPage() {
  const { t } = useTranslation();
  const { data: countries, isLoading } = useCountries();

  return (
    <div className="container mx-auto px-4 py-8">
      <Seo
        title={t('seo.citiesTitle')}
        description={t('seo.citiesDescription')}
        canonicalPath="/cities"
      />
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:text-foreground transition-colors">
          <Home className="h-4 w-4" />
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">{t('browse.cities')}</span>
      </nav>

      <div className="text-center mb-12">
        <Globe className="h-10 w-10 mx-auto text-primary mb-3" />
        <h1 className="text-3xl md:text-4xl font-bold">{t('browse.citiesTitle')}</h1>
        <p className="mt-2 text-muted-foreground">{t('browse.citiesSubtitle')}</p>
      </div>

      {isLoading ? (
        <div className="space-y-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-6 w-40 mb-4" />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-20 rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-10">
          {countries?.map((country) => (
            <CountrySection key={country.code} country={country} />
          ))}
        </div>
      )}
    </div>
  );
}

function CountrySection({ country }: { country: Country }) {
  const { t } = useTranslation();
  const { data: cities } = useCities(country.code);

  if (!cities || cities.length === 0) return null;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <MapPin className="h-5 w-5 text-primary" />
        {t(`countries.${country.code}`, { defaultValue: country.name })}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {cities.map((city) => (
          <Link key={city.name} to={`/city/${country.code}/${encodeURIComponent(city.name)}`}>
            <Card className="hover:shadow-md transition-shadow hover:border-primary/50 h-full">
              <CardContent className="py-4 px-5 flex items-center gap-3">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <span className="font-medium text-sm">{city.name}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
