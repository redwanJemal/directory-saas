import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Seo } from '@/lib/seo';
import { WebsiteStructuredData } from '@/lib/structured-data';
import {
  Search,
  Star,
  Phone,
  ShieldCheck,
  UtensilsCrossed,
  Scissors,
  Briefcase,
  Car,
  Heart,
  ShoppingBag,
  Users,
  ChevronRight,
  Clock,
  Percent,
  BadgeCheck,
  ArrowRight,
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useCategories,
  useSearchQuery,
  useCountries,
  useCities,
  useFeaturedDeals,
} from '@/features/search/hooks/use-search';
import { formatCurrency } from '@/lib/format';
import type { Category } from '@/features/search/types';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'food-drink': <UtensilsCrossed className="h-7 w-7" />,
  'beauty-grooming': <Scissors className="h-7 w-7" />,
  services: <Briefcase className="h-7 w-7" />,
  automotive: <Car className="h-7 w-7" />,
  'health-wellness': <Heart className="h-7 w-7" />,
  shopping: <ShoppingBag className="h-7 w-7" />,
  community: <Users className="h-7 w-7" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  'food-drink': 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  'beauty-grooming': 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
  services: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  automotive: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
  'health-wellness': 'bg-red-500/10 text-red-600 dark:text-red-400',
  shopping: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  community: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
};

export function LandingPage() {
  const { t } = useTranslation();

  return (
    <>
      <Seo
        title={t('seo.homeTitle')}
        description={t('seo.homeDescription')}
        canonicalPath="/"
      />
      <WebsiteStructuredData />
      <HeroSection />
      <CategoriesSection />
      <FeaturedBusinessesSection />
      <DealsSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <CtaSection />
    </>
  );
}

function HeroSection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');

  const { data: countries } = useCountries();
  const { data: cities } = useCities(country || undefined);

  const selectedCountryName = useMemo(() => {
    if (!country || !countries) return '';
    return countries.find((c) => c.code === country)?.name ?? '';
  }, [country, countries]);

  const selectedCityName = useMemo(() => {
    if (!city || !cities) return '';
    return cities.find((c) => c.name === city)?.name ?? '';
  }, [city, cities]);

  const locationLabel = selectedCityName || selectedCountryName || '';

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (country) params.set('country', country);
    if (city) params.set('city', city);
    navigate(`/search?${params}`);
  };

  const handleCountryChange = (value: string) => {
    setCountry(value);
    setCity('');
  };

  return (
    <section className="relative bg-gradient-to-br from-primary/10 via-background to-primary/5 py-20 md:py-32">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          {locationLabel
            ? t('landing.heroTitle', { location: locationLabel })
            : t('landing.heroTitleDefault')}
        </h1>
        <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          {t('landing.heroSubtitle')}
        </p>

        <div className="mt-8 mx-auto max-w-3xl">
          <div className="flex flex-col sm:flex-row gap-2 bg-card rounded-xl p-3 shadow-lg border">
            <Select value={country} onValueChange={handleCountryChange}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={t('landing.selectCountry')} />
              </SelectTrigger>
              <SelectContent>
                {countries?.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={city} onValueChange={setCity} disabled={!country}>
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

        {/* Category quick-links */}
        <CategoryQuickLinks />
      </div>
    </section>
  );
}

function CategoryQuickLinks() {
  const { data: categories } = useCategories();

  const topCategories = useMemo(() => {
    if (!categories) return [];
    return categories.filter((c) => !c.children || c.children.length >= 0).slice(0, 7);
  }, [categories]);

  if (topCategories.length === 0) return null;

  return (
    <div className="mt-8 flex flex-wrap justify-center gap-3">
      {topCategories.map((cat) => (
        <Link
          key={cat.slug}
          to={`/search?category=${cat.slug}`}
          className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium hover:bg-accent hover:border-primary/50 transition-colors"
        >
          <span className={CATEGORY_COLORS[cat.slug] ? '' : 'text-primary'}>
            {CATEGORY_ICONS[cat.slug] ?? <Briefcase className="h-4 w-4" />}
          </span>
          {cat.name}
        </Link>
      ))}
    </div>
  );
}

function CategoriesSection() {
  const { t } = useTranslation();
  const { data: categories, isLoading } = useCategories();

  const topCategories = useMemo(() => {
    if (!categories) return [];
    return categories.slice(0, 7);
  }, [categories]);

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">
              {t('landing.categoriesTitle')}
            </h2>
            <p className="mt-1 text-muted-foreground">{t('categories.subtitle')}</p>
          </div>
          <Button variant="ghost" asChild className="hidden sm:flex">
            <Link to="/categories">
              {t('landing.exploreAll')}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="flex flex-col items-center gap-3 py-6">
                  <Skeleton className="h-14 w-14 rounded-2xl" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            {topCategories.map((cat) => (
              <CategoryCard key={cat.slug} category={cat} />
            ))}
          </div>
        )}

        <div className="mt-6 text-center sm:hidden">
          <Button variant="outline" asChild>
            <Link to="/categories">
              {t('landing.exploreAll')}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function CategoryCard({ category }: { category: Category }) {
  const { t } = useTranslation();
  const colorClass = CATEGORY_COLORS[category.slug] ?? 'bg-primary/10 text-primary';

  return (
    <Link to={`/categories/${category.slug}`}>
      <Card className="hover:shadow-md transition-shadow hover:border-primary/50 h-full">
        <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${colorClass}`}>
            {CATEGORY_ICONS[category.slug] ?? <Briefcase className="h-7 w-7" />}
          </div>
          <h3 className="font-medium text-sm">{category.name}</h3>
          <p className="text-xs text-muted-foreground">
            {t('categories.vendorCount', { count: category.vendorCount })}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

function FeaturedBusinessesSection() {
  const { t } = useTranslation();
  const { data: searchData, isLoading } = useSearchQuery({
    sort: '-rating',
    pageSize: 4,
    page: 1,
  });

  const featured = searchData?.data ?? [];

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold">
            {t('landing.featuredVendors')}
          </h2>
          <Button variant="ghost" asChild>
            <Link to="/search">
              {t('common.viewAll')}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-[4/3] w-full" />
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                  </CardContent>
                </Card>
              ))
            : featured.map((vendor) => (
                <Link key={vendor.id} to={`/vendors/${vendor.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
                    <div className="aspect-[4/3] relative overflow-hidden bg-muted">
                      {vendor.coverPhoto ? (
                        <img
                          src={vendor.coverPhoto}
                          alt={vendor.name}
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <span className="text-4xl font-bold opacity-20">
                            {vendor.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      {vendor.verified && (
                        <Badge
                          variant="secondary"
                          className="absolute top-2 left-2 gap-1"
                        >
                          <BadgeCheck className="h-3 w-3" />
                          {t('common.verified')}
                        </Badge>
                      )}
                      {vendor.activeDeals > 0 && (
                        <Badge className="absolute top-2 right-2 gap-1">
                          <Percent className="h-3 w-3" />
                          {t('search.featured')}
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold truncate">{vendor.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {vendor.categories?.[0]?.name ?? vendor.category} · {vendor.city}, {t(`countries.${vendor.country}`, { defaultValue: vendor.country })}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-primary text-primary" />
                          <span className="text-sm font-medium">
                            {vendor.rating.toFixed(1)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({vendor.reviewCount})
                          </span>
                        </div>
                        {vendor.startingPrice > 0 && (
                          <span className="text-sm font-medium text-muted-foreground">
                            {t('search.startingFrom', {
                              price: formatCurrency(vendor.startingPrice),
                            })}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
          {!isLoading && featured.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground py-8">
              {t('common.noResults')}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function DealsSection() {
  const { t } = useTranslation();
  const { data: deals, isLoading } = useFeaturedDeals();

  if (!isLoading && (!deals || deals.length === 0)) return null;

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">
              {t('landing.todaysDeals')}
            </h2>
            <p className="mt-1 text-muted-foreground">
              {t('landing.dealsSubtitle')}
            </p>
          </div>
          <Button variant="ghost" asChild>
            <Link to="/deals">
              {t('landing.viewAllDeals')}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-[16/9] w-full" />
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                  </CardContent>
                </Card>
              ))
            : deals?.slice(0, 4).map((deal) => (
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
                      <div className="flex items-center justify-between mt-2">
                        {deal.dealPrice != null && deal.originalPrice != null ? (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-primary">
                              {formatCurrency(deal.dealPrice)}
                            </span>
                            <span className="text-xs text-muted-foreground line-through">
                              {formatCurrency(deal.originalPrice)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {deal.provider.city}, {t(`countries.${deal.provider.country}`, { defaultValue: deal.provider.country })}
                          </span>
                        )}
                        {deal.expiresAt && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {t('landing.expires', {
                              date: new Date(deal.expiresAt).toLocaleDateString(),
                            })}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const { t } = useTranslation();

  const steps = [
    {
      icon: <Search className="h-8 w-8" />,
      title: t('landing.step1Title'),
      description: t('landing.step1Description'),
    },
    {
      icon: <Star className="h-8 w-8" />,
      title: t('landing.step2Title'),
      description: t('landing.step2Description'),
    },
    {
      icon: <Phone className="h-8 w-8" />,
      title: t('landing.step3Title'),
      description: t('landing.step3Description'),
    },
  ];

  return (
    <section id="how-it-works" className="py-16 bg-muted/50">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-12">
          {t('landing.howItWorksTitle')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <Card key={index} className="border-0 shadow-none bg-transparent">
              <CardContent className="flex flex-col items-center gap-4 pt-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {step.icon}
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                  {index + 1}
                </div>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const { t } = useTranslation();

  const testimonials = [
    {
      text: t('testimonials.quote1'),
      name: t('testimonials.name1'),
      initials: 'SA',
    },
    {
      text: t('testimonials.quote2'),
      name: t('testimonials.name2'),
      initials: 'MK',
    },
    {
      text: t('testimonials.quote3'),
      name: t('testimonials.name3'),
      initials: 'HT',
    },
  ];

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-12">
          {t('landing.testimonialsTitle')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((item, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="text-4xl text-primary/30 mb-4">&ldquo;</div>
                <p className="text-muted-foreground italic mb-6">{item.text}</p>
                <div className="flex items-center justify-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {item.initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm">{item.name}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  const { t } = useTranslation();

  return (
    <section className="py-20 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
      <div className="container mx-auto px-4 text-center">
        <ShieldCheck className="h-12 w-12 mx-auto text-primary mb-4" />
        <h2 className="text-2xl md:text-4xl font-bold">{t('landing.ctaTitle')}</h2>
        <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
          {t('landing.ctaSubtitle')}
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" asChild>
            <Link to="/search">
              <Search className="mr-2 h-4 w-4" />
              {t('landing.searchButton')}
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/register">
              {t('landing.ctaButton')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
