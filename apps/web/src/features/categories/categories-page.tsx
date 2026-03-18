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
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useCategories } from '@/features/search/hooks/use-search';
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

export function CategoriesPage() {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug?: string }>();
  const { data: apiCategories, isLoading } = useCategories();

  if (slug && apiCategories) {
    const parentCategory = apiCategories.find((c) => c.slug === slug);
    if (parentCategory) {
      return <CategoryDetailView category={parentCategory} />;
    }
  }

  const categories = apiCategories ?? [];

  return (
    <div className="container mx-auto px-4 py-8">
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
                      {cat.children.length} {t('categories.subtitle').split(' ')[0]}
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link to="/categories" className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block">
          {t('landing.categoriesTitle')}
        </Link>
        <ChevronRight className="h-3 w-3 inline mx-1 text-muted-foreground" />
        <span className="text-sm">{category.name}</span>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
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

      {/* Subcategories */}
      {subcategories.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {subcategories.map((sub) => (
            <Link key={sub.slug} to={`/search?category=${sub.slug}`}>
              <Card className="hover:shadow-md transition-shadow hover:border-primary/50 h-full">
                <CardContent className="py-4 text-center">
                  <h3 className="font-medium text-sm">{sub.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('categories.vendorCount', { count: sub.vendorCount })}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* View all businesses in this category */}
      <div className="text-center">
        <Button asChild>
          <Link to={`/search?category=${category.slug}`}>
            {t('search.title')} - {category.name}
          </Link>
        </Button>
      </div>
    </div>
  );
}
