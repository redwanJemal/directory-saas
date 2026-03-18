import { useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Clock, Percent, BadgeCheck, Tag, ChevronRight, Home } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDeals, useCategories, useCountries, useCities } from '@/features/search/hooks/use-search';
import { formatCurrency } from '@/lib/format';

type DealSort = 'newest' | 'ending-soon' | 'highest-discount';

export function DealsPage() {
  const { t } = useTranslation();
  const [country, setCountry] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [sort, setSort] = useState<DealSort>('newest');
  const [page, setPage] = useState(1);

  const { data: countries } = useCountries();
  const { data: cities } = useCities(country || undefined);
  const { data: categories } = useCategories();

  const { data, isLoading } = useDeals({
    country: country || undefined,
    city: city || undefined,
    category: category || undefined,
    page,
    pageSize: 20,
  });

  let deals = [...(data?.data ?? [])];

  // Client-side sort
  if (sort === 'ending-soon') {
    deals.sort((a, b) => {
      if (!a.expiresAt) return 1;
      if (!b.expiresAt) return -1;
      return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
    });
  } else if (sort === 'highest-discount') {
    deals.sort((a, b) => (b.discountPercent ?? 0) - (a.discountPercent ?? 0));
  }
  // 'newest' is default from API (sorted by createdAt desc)

  const pagination = data?.pagination ?? null;

  const handleCountryChange = (value: string) => {
    setCountry(value);
    setCity('');
    setPage(1);
  };

  const clearFilters = () => {
    setCountry('');
    setCity('');
    setCategory('');
    setSort('newest');
    setPage(1);
  };

  const hasFilters = country || city || category;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:text-foreground transition-colors">
          <Home className="h-4 w-4" />
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">{t('nav.deals')}</span>
      </nav>

      <div className="text-center mb-8">
        <Tag className="h-10 w-10 mx-auto text-primary mb-3" />
        <h1 className="text-3xl md:text-4xl font-bold">{t('deals.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('deals.subtitle')}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Select value={country} onValueChange={handleCountryChange}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder={t('search.allCountries')} />
          </SelectTrigger>
          <SelectContent>
            {countries?.map((c) => (
              <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={city} onValueChange={(v) => { setCity(v); setPage(1); }} disabled={!country}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder={t('search.allCities')} />
          </SelectTrigger>
          <SelectContent>
            {cities?.map((c) => (
              <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder={t('search.allCategories')} />
          </SelectTrigger>
          <SelectContent>
            {categories?.map((cat) => (
              <SelectItem key={cat.slug} value={cat.slug}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(v) => setSort(v as DealSort)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder={t('search.sortBy')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{t('search.newest')}</SelectItem>
            <SelectItem value="ending-soon">{t('deals.endingSoon')}</SelectItem>
            <SelectItem value="highest-discount">{t('deals.highestDiscount')}</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            {t('search.clearFilters')}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-[16/9] w-full" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : deals.length === 0 ? (
        <div className="text-center py-16">
          <Percent className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
          <p className="text-lg text-muted-foreground">{t('deals.noDeals')}</p>
          {hasFilters && (
            <Button variant="outline" className="mt-4" onClick={clearFilters}>
              {t('search.clearFilters')}
            </Button>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            {t('search.results', { count: pagination?.totalCount ?? deals.length })}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {deals.map((deal) => (
              <Link key={deal.id} to={`/vendors/${deal.provider.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow group h-full">
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
                        {t('deals.off', { percent: deal.discountPercent })}
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold truncate">{deal.title}</h3>
                    {deal.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {deal.description}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
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
                          {t('deals.expires', {
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
