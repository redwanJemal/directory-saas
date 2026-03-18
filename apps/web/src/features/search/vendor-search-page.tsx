import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { FilterSidebar } from './components/filter-sidebar';
import { SearchResults } from './components/search-results';
import { useSearchQuery } from './hooks/use-search';
import type { SearchParams } from './types';

export function VendorSearchPage() {
  const { t } = useTranslation();
  const [urlParams, setUrlParams] = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const params: SearchParams = useMemo(
    () => ({
      query: urlParams.get('q') ?? undefined,
      category: urlParams.get('category') ?? undefined,
      country: urlParams.get('country') ?? undefined,
      city: urlParams.get('city') ?? undefined,
      location: urlParams.get('location') ?? undefined,
      minBudget: urlParams.get('minBudget') ? Number(urlParams.get('minBudget')) : undefined,
      maxBudget: urlParams.get('maxBudget') ? Number(urlParams.get('maxBudget')) : undefined,
      minRating: urlParams.get('minRating') ? Number(urlParams.get('minRating')) : undefined,
      verified: urlParams.get('verified') === 'true' ? true : undefined,
      hasDeals: urlParams.get('hasDeals') === 'true' ? true : undefined,
      sort: urlParams.get('sort') ?? 'recommended',
      page: urlParams.get('page') ? Number(urlParams.get('page')) : 1,
      pageSize: 12,
    }),
    [urlParams],
  );

  const { data, isLoading, error } = useSearchQuery(params);

  const updateParams = useCallback(
    (updates: Partial<SearchParams>) => {
      setUrlParams((prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(updates).forEach(([key, value]) => {
          if (value === undefined || value === '' || value === false || (Array.isArray(value) && value.length === 0)) {
            next.delete(key);
          } else if (Array.isArray(value)) {
            next.set(key, value.join(','));
          } else if (typeof value === 'boolean') {
            next.set(key, 'true');
          } else {
            next.set(key, String(value));
          }
        });
        // Reset page when filters change (unless page itself is being updated)
        if (!('page' in updates)) {
          next.delete('page');
        }
        return next;
      });
    },
    [setUrlParams],
  );

  const handleClearFilters = useCallback(() => {
    setUrlParams({});
  }, [setUrlParams]);

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">{t('search.title')}</h1>

      <div className="flex gap-6">
        {/* Desktop filter sidebar */}
        <aside className="hidden lg:block w-[280px] shrink-0">
          <FilterSidebar
            params={params}
            onChange={updateParams}
            onClear={handleClearFilters}
          />
        </aside>

        {/* Mobile filter button + results */}
        <div className="flex-1 min-w-0">
          <div className="lg:hidden mb-4">
            <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  {t('search.filters')}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>{t('search.filters')}</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterSidebar
                    params={params}
                    onChange={(updates) => {
                      updateParams(updates);
                      setMobileFiltersOpen(false);
                    }}
                    onClear={() => {
                      handleClearFilters();
                      setMobileFiltersOpen(false);
                    }}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <SearchResults
            vendors={data?.data ?? []}
            pagination={data?.pagination ?? null}
            isLoading={isLoading}
            error={!!error}
            sort={params.sort ?? 'recommended'}
            onSortChange={(sort) => updateParams({ sort })}
            onPageChange={(page) => updateParams({ page })}
            onClearFilters={handleClearFilters}
          />
        </div>
      </div>
    </div>
  );
}
