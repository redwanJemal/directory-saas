import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  UtensilsCrossed,
  Scissors,
  Briefcase,
  Car,
  Heart,
  ShoppingBag,
  Users,
  ChevronRight,
  Home,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCategories, useSearchQuery } from '@/features/search/hooks/use-search';
import { VendorCard } from '@/features/search/components/vendor-card';
import type { Category } from '@/features/search/types';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'food-drink': <UtensilsCrossed className="h-8 w-8" />,
  'beauty-grooming': <Scissors className="h-8 w-8" />,
  services: <Briefcase className="h-8 w-8" />,
  automotive: <Car className="h-8 w-8" />,
  'health-wellness': <Heart className="h-8 w-8" />,
  shopping: <ShoppingBag className="h-8 w-8" />,
  community: <Users className="h-8 w-8" />,
};

const CATEGORY_ICON_SM: Record<string, React.ReactNode> = {
  'food-drink': <UtensilsCrossed className="h-5 w-5" />,
  'beauty-grooming': <Scissors className="h-5 w-5" />,
  services: <Briefcase className="h-5 w-5" />,
  automotive: <Car className="h-5 w-5" />,
  'health-wellness': <Heart className="h-5 w-5" />,
  shopping: <ShoppingBag className="h-5 w-5" />,
  community: <Users className="h-5 w-5" />,
};

export function CategoriesPage() {
  const { slug } = useParams<{ slug?: string }>();
  const { data: apiCategories, isLoading } = useCategories();

  if (slug && apiCategories) {
    const parentCategory = apiCategories.find((c) => c.slug === slug);
    if (parentCategory) {
      return <CategoryDetailView category={parentCategory} />;
    }
  }

  return <CategoriesIndex categories={apiCategories ?? []} isLoading={isLoading} />;
}

function CategoriesIndex({ categories, isLoading }: { categories: Category[]; isLoading: boolean }) {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:text-foreground transition-colors">
          <Home className="h-4 w-4" />
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">{t('nav.categories')}</span>
      </nav>

      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold">
          {t('landing.categoriesTitle')}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t('categories.subtitle')}
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 7 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex flex-col items-center gap-3 py-8">
                <Skeleton className="h-16 w-16 rounded-full" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <Link key={cat.slug} to={`/categories/${cat.slug}`}>
              <Card className="hover:shadow-lg transition-shadow hover:border-primary/50 h-full">
                <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {CATEGORY_ICONS[cat.slug] ?? <Briefcase className="h-8 w-8" />}
                  </div>
                  <h3 className="font-semibold">{cat.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('categories.vendorCount', { count: cat.vendorCount })}
                  </p>
                  {cat.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {cat.description}
                    </p>
                  )}
                  {cat.children && cat.children.length > 0 && (
                    <div className="flex items-center text-xs text-primary font-medium">
                      {t('browse.subcategoryCount', { count: cat.children.length })}
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryDetailView({ category }: { category: Category }) {
  const { t } = useTranslation();
  const subcategories = category.children ?? [];
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const searchCategory = activeSubcategory ?? category.slug;

  const { data: searchData, isLoading: searchLoading } = useSearchQuery({
    category: searchCategory,
    page,
    pageSize: 12,
    sort: '-rating',
  });

  const vendors = searchData?.data ?? [];
  const pagination = searchData?.pagination ?? null;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:text-foreground transition-colors">
          <Home className="h-4 w-4" />
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/categories" className="hover:text-foreground transition-colors">
          {t('nav.categories')}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">{category.name}</span>
        {activeSubcategory && (
          <>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">
              {subcategories.find((s) => s.slug === activeSubcategory)?.name}
            </span>
          </>
        )}
      </nav>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
          {CATEGORY_ICONS[category.slug] ?? <Briefcase className="h-8 w-8" />}
        </div>
        <div>
          <h1 className="text-3xl font-bold">{category.name}</h1>
          {category.description && (
            <p className="text-muted-foreground mt-1">{category.description}</p>
          )}
          <p className="text-sm text-muted-foreground mt-1">
            {t('categories.vendorCount', { count: category.vendorCount })}
          </p>
        </div>
      </div>

      {/* Subcategory chips */}
      {subcategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <Badge
            variant={activeSubcategory === null ? 'default' : 'outline'}
            className="cursor-pointer text-sm px-4 py-1.5"
            onClick={() => { setActiveSubcategory(null); setPage(1); }}
          >
            {t('common.all')}
          </Badge>
          {subcategories.map((sub) => (
            <Badge
              key={sub.slug}
              variant={activeSubcategory === sub.slug ? 'default' : 'outline'}
              className="cursor-pointer text-sm px-4 py-1.5"
              onClick={() => { setActiveSubcategory(sub.slug); setPage(1); }}
            >
              {sub.name}
              <span className="ml-1 opacity-70">({sub.vendorCount})</span>
            </Badge>
          ))}
        </div>
      )}

      {/* Business grid */}
      {searchLoading ? (
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
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto mb-4">
            {CATEGORY_ICON_SM[category.slug] ?? <Briefcase className="h-5 w-5" />}
          </div>
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
