import { useState, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Seo } from '@/lib/seo';
import {
  Search,
  MapPin,
  Building2,
  Sparkles,
  ChevronRight,
  Home,
  BadgeCheck,
  Percent,
  UtensilsCrossed,
  Scissors,
  Briefcase,
  Car,
  Heart,
  ShoppingBag,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useCategories,
  useSearchQuery,
  useCountries,
  useCities,
  useFeaturedDeals,
} from '@/features/search/hooks/use-search';
import { VendorCard } from '@/features/search/components/vendor-card';
import { formatCurrency } from '@/lib/format';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'food-drink': <UtensilsCrossed className="h-5 w-5" />,
  'beauty-grooming': <Scissors className="h-5 w-5" />,
  services: <Briefcase className="h-5 w-5" />,
  automotive: <Car className="h-5 w-5" />,
  'health-wellness': <Heart className="h-5 w-5" />,
  shopping: <ShoppingBag className="h-5 w-5" />,
  community: <Users className="h-5 w-5" />,
};

export function CountryLandingPage() {
  const { t } = useTranslation();
  const { countryCode } = useParams<{ countryCode: string }>();
  const navigate = useNavigate();
  const code = countryCode?.toUpperCase() ?? '';

  const { data: countries } = useCountries();
  const { data: cities } = useCities(code || undefined);
  const { data: categories } = useCategories();
  const [selectedCity, setSelectedCity] = useState('');

  const countryName = useMemo(() => {
    if (!code || !countries) return code;
    return countries.find((c) => c.code === code)?.name ?? t(`countries.${code}`, { defaultValue: code });
  }, [code, countries, t]);

  // Stats: total businesses
  const { data: statsData } = useSearchQuery({
    country: code,
    pageSize: 1,
    page: 1,
  });

  // Featured businesses (top rated)
  const { data: featuredData, isLoading: featuredLoading } = useSearchQuery({
    country: code,
    sort: '-rating',
    pageSize: 8,
    page: 1,
  });

  // Recently added
  const { data: newData } = useSearchQuery({
    country: code,
    sort: '-createdAt',
    pageSize: 4,
    page: 1,
  });

  // Deals in this country
  const { data: deals } = useFeaturedDeals();
  const countryDeals = useMemo(() => {
    if (!deals || !code) return [];
    return deals.filter((d) => d.provider?.country === code).slice(0, 4);
  }, [deals, code]);

  const totalBusinesses = statsData?.pagination?.totalCount ?? 0;
  const featuredVendors = featuredData?.data ?? [];
  const newVendors = newData?.data ?? [];

  const handleSearch = () => {
    const params = new URLSearchParams();
    params.set('country', code);
    if (selectedCity) params.set('city', selectedCity);
    navigate(`/search?${params}`);
  };

  return (
    <div>
      <Seo
        title={t('countryLanding.seoTitle', { country: countryName })}
        description={t('countryLanding.seoDescription', { country: countryName })}
        canonicalPath={`/country/${code.toLowerCase()}`}
      />

      {/* Breadcrumb */}
      <div className="container mx-auto px-4 pt-6">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">
            <Home className="h-4 w-4" />
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium">{countryName}</span>
        </nav>
      </div>

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-primary/5 py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm mb-4">
            <MapPin className="h-4 w-4 text-primary" />
            {countryName}
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
            {t('countryLanding.heroTitle', { country: countryName })}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('countryLanding.heroSubtitle', { country: countryName })}
          </p>

          {/* Search bar */}
          <div className="mt-8 mx-auto max-w-3xl">
            <div className="flex flex-col sm:flex-row gap-2 bg-card rounded-xl p-3 shadow-lg border">
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={t('landing.selectCity')} />
                </SelectTrigger>
                <SelectContent>
                  {cities?.map((c) => (
                    <SelectItem key={c.name} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="lg" onClick={handleSearch}>
                <Search className="mr-2 h-4 w-4" />
                {t('landing.searchButton')}
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mt-10">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Building2 className="h-5 w-5 text-primary" />
                <span className="text-3xl font-bold">{totalBusinesses}</span>
              </div>
              <p className="text-sm text-muted-foreground">{t('countryLanding.businesses')}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="text-3xl font-bold">{cities?.length ?? 0}</span>
              </div>
              <p className="text-sm text-muted-foreground">{t('countryLanding.cities')}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="text-3xl font-bold">{newVendors.length}</span>
              </div>
              <p className="text-sm text-muted-foreground">{t('countryLanding.newThisMonth')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Cities in this country */}
      {cities && cities.length > 0 && (
        <section className="py-12 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6">
              {t('countryLanding.exploreCities', { country: countryName })}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
              {cities.map((city) => (
                <Link
                  key={city.name}
                  to={`/city/${code}/${encodeURIComponent(city.name)}`}
                  className="group"
                >
                  <Card className="hover:shadow-md transition-shadow hover:border-primary/50">
                    <CardContent className="flex flex-col items-center gap-2 py-5 text-center">
                      <MapPin className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                      <span className="font-medium text-sm">{city.name}</span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      {categories && categories.length > 0 && (
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6">
              {t('countryLanding.browseCategories')}
            </h2>
            <div className="flex flex-wrap gap-3">
              {categories.slice(0, 7).map((cat) => (
                <Link
                  key={cat.slug}
                  to={`/search?country=${code}&category=${cat.slug}`}
                >
                  <Badge
                    variant="outline"
                    className="px-4 py-2 text-sm gap-2 hover:bg-primary/10 hover:border-primary/50 transition-colors cursor-pointer"
                  >
                    {CATEGORY_ICONS[cat.slug] ?? <Briefcase className="h-4 w-4" />}
                    {cat.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured businesses */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              {t('countryLanding.topBusinesses', { country: countryName })}
            </h2>
            <Button variant="ghost" asChild>
              <Link to={`/search?country=${code}&sort=-rating`}>
                {t('common.viewAll')}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          {featuredLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-[4/3]" />
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : featuredVendors.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {featuredVendors.slice(0, 8).map((vendor) => (
                <VendorCard key={vendor.id} vendor={vendor} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>{t('countryLanding.noBusinessesYet', { country: countryName })}</p>
            </div>
          )}
        </div>
      </section>

      {/* Deals */}
      {countryDeals.length > 0 && (
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {t('countryLanding.dealsIn', { country: countryName })}
              </h2>
              <Button variant="ghost" asChild>
                <Link to={`/deals?country=${code}`}>
                  {t('common.viewAll')}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {countryDeals.map((deal) => (
                <Link key={deal.id} to={`/vendors/${deal.provider.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
                    <div className="aspect-[16/9] relative overflow-hidden bg-muted">
                      {deal.imageUrl || deal.provider.coverPhoto ? (
                        <img
                          src={deal.imageUrl ?? deal.provider.coverPhoto ?? ''}
                          alt={deal.title}
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/5">
                          <Percent className="h-12 w-12 text-primary/20" />
                        </div>
                      )}
                      {deal.discountPercent && (
                        <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground">
                          {t('landing.off', { percent: deal.discountPercent })}
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold truncate">{deal.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                        {deal.provider.name}
                        {deal.provider.verified && (
                          <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                        )}
                      </p>
                      {deal.dealPrice != null && deal.originalPrice != null && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="font-semibold text-primary">
                            {formatCurrency(deal.dealPrice)}
                          </span>
                          <span className="text-xs text-muted-foreground line-through">
                            {formatCurrency(deal.originalPrice)}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold">
            {t('countryLanding.ctaTitle', { country: countryName })}
          </h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            {t('countryLanding.ctaSubtitle', { country: countryName })}
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild>
              <Link to={`/search?country=${code}`}>
                <Search className="mr-2 h-4 w-4" />
                {t('countryLanding.searchIn', { country: countryName })}
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/register">
                {t('landing.ctaButton')}
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
