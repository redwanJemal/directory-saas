import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { VendorCard } from './vendor-card';
import type { VendorSearchResult } from '../types';
import type { PaginationMeta } from '@/lib/types';

interface SearchResultsProps {
  vendors: VendorSearchResult[];
  pagination: PaginationMeta | null;
  isLoading: boolean;
  error?: boolean;
  sort: string;
  onSortChange: (sort: string) => void;
  onPageChange: (page: number) => void;
  onClearFilters: () => void;
}

export function SearchResults({
  vendors,
  pagination,
  isLoading,
  error,
  sort,
  onSortChange,
  onPageChange,
  onClearFilters,
}: SearchResultsProps) {
  const { t } = useTranslation();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-destructive mb-4">{t('common.errorOccurred')}</p>
        <Button variant="outline" onClick={onClearFilters}>
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-9 w-40" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-[4/3]" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (vendors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-6xl mb-4 opacity-20">🔍</div>
        <h3 className="text-lg font-semibold mb-2">{t('search.noResults')}</h3>
        <Button variant="outline" onClick={onClearFilters}>
          {t('search.clearFilters')}
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {t('search.results', { count: pagination?.totalCount ?? vendors.length })}
        </p>
        <Select value={sort} onValueChange={onSortChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t('search.sortBy')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recommended">{t('search.recommended')}</SelectItem>
            <SelectItem value="-rating">{t('search.ratingHighLow')}</SelectItem>
            <SelectItem value="price">{t('search.priceLowHigh')}</SelectItem>
            <SelectItem value="-price">{t('search.priceHighLow')}</SelectItem>
            <SelectItem value="-reviewCount">{t('search.mostReviewed')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
            onClick={() => onPageChange(pagination.page - 1)}
          >
            {t('common.back')}
          </Button>
          <span className="text-sm text-muted-foreground">
            {pagination.page} / {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => onPageChange(pagination.page + 1)}
          >
            {t('common.next')}
          </Button>
        </div>
      )}
    </div>
  );
}
