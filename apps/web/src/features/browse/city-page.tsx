import { useState, useMemo } from 'react';
import { Link, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  MapPin,
  Building2,
  Star,
  Sparkles,
  ChevronRight,
  Home,
  UtensilsCrossed,
  Scissors,
  Briefcase,
  Car,
  Heart,
  ShoppingBag,
  Users,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  useCategories,
  useSearchQuery,
  useCountries,
} from '@/features/search/hooks/use-search';
import { VendorCard } from '@/features/search/components/vendor-card';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'food-drink': <UtensilsCrossed className="h-4 w-4" />,
  'beauty-grooming': <Scissors className="h-4 w-4" />,
  services: <Briefcase className="h-4 w-4" />,
  automotive: <Car className="h-4 w-4" />,
  'health-wellness': <Heart className="h-4 w-4" />,
  shopping: <ShoppingBag className="h-4 w-4" />,
  community: <Users className="h-4 w-4" />,
};

export function CityPage() {
  const { t } = useTranslation();
  const { country, city } = useParams<{ country: string; city: string }>();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data: countries } = useCountries();
  const { data: categories } = useCategories();

  const countryName = useMemo(() => {
    if (!country || !countries) return country ?? '';
    return countries.find((c) => c.code === country)?.name ?? t(`countries.${country}`, { defaultValue: country });
  }, [country, countries, t]);

  const cityDisplay = city ? decodeURIComponent(city) : '';

  // Fetch businesses for this city
  const { data: searchData, isLoading } = useSearchQuery({
    country: country,
    city: cityDisplay,
    category: activeCategory ?? undefined,
    page,
    pageSize: 12,
    sort: '-rating',
  });

  // Fetch stats: total businesses (unfiltered)
  const { data: statsData } = useSearchQuery({
    country: country,
    city: cityDisplay,
    pageSize: 1,
    page: 1,
  });

  // Fetch recently added this month
  const { data: newData } = useSearchQuery({
    country: country,
    city: cityDisplay,
    sort: '-createdAt',
    pageSize: 1,
    page: 1,
  });

  const vendors = searchData?.data ?? [];
  const pagination = searchData?.pagination ?? null;
  const totalBusinesses = statsData?.pagination?.totalCount ?? 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:text-foreground transition-colors">
          <Home className="h-4 w-4" />
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/cities" className="hover:text-foreground transition-colors">
          {t('browse.cities')}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">{cityDisplay}</span>
      </nav>

      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-primary/5 rounded-2xl p-8 md:p-12 mb-8">
        <div className="flex items-center gap-2 text-primary mb-3">
          <MapPin className="h-5 w-5" />
          <span className="text-sm font-medium">{countryName}</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold">
          {t('browse.cityTitle', { city: cityDisplay })}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t('browse.citySubtitle', { city: cityDisplay, country: countryName })}
        </p>

        {/* Stats */}
        <div className="flex flex-wrap gap-6 mt-6">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{totalBusinesses}</p>
              <p className="text-xs text-muted-foreground">{t('browse.totalBusinesses')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{pagination?.totalCount ?? 0}</p>
              <p className="text-xs text-muted-foreground">{t('browse.totalReviews')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{newData?.pagination?.totalCount ?? 0}</p>
              <p className="text-xs text-muted-foreground">{t('browse.newThisMonth')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category filter tabs */}
      {categories && categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <Badge
            variant={activeCategory === null ? 'default' : 'outline'}
            className="cursor-pointer text-sm px-4 py-1.5"
            onClick={() => { setActiveCategory(null); setPage(1); }}
          >
            {t('common.all')}
          </Badge>
          {categories.map((cat) => (
            <Badge
              key={cat.slug}
              variant={activeCategory === cat.slug ? 'default' : 'outline'}
              className="cursor-pointer text-sm px-4 py-1.5 gap-1"
              onClick={() => { setActiveCategory(cat.slug); setPage(1); }}
            >
              {CATEGORY_ICONS[cat.slug]}
              {cat.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Business grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-[4/3]" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : vendors.length === 0 ? (
        <div className="text-center py-16">
          <MapPin className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
          <p className="text-muted-foreground">{t('search.noResults')}</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link to="/search">{t('search.title')}</Link>
          </Button>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            {t('search.results', { count: pagination?.totalCount ?? vendors.length })}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {vendors.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => setPage(pagination.page - 1)}
              >
                {t('common.back')}
              </Button>
              {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                const startPage = Math.max(1, Math.min(pagination.page - 2, pagination.totalPages - 4));
                const p = startPage + i;
                if (p > pagination.totalPages) return null;
                return (
                  <Button
                    key={p}
                    variant={p === pagination.page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage(pagination.page + 1)}
              >
                {t('common.next')}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
