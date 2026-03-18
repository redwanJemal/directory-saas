import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Clock, Percent, BadgeCheck, Tag } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useDeals } from '@/features/search/hooks/use-search';
import { formatCurrency } from '@/lib/format';

export function DealsPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useDeals({ pageSize: 20 });

  const deals = data?.data ?? [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <Tag className="h-10 w-10 mx-auto text-primary mb-3" />
        <h1 className="text-3xl md:text-4xl font-bold">{t('deals.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('deals.subtitle')}</p>
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
        </div>
      ) : (
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
      )}

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <Button variant="outline" asChild>
            <Link to="/deals">{t('common.viewAll')}</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
