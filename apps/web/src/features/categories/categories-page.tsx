import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  Camera,
  UtensilsCrossed,
  Building2,
  Palette,
  Music,
  ClipboardList,
  Flower2,
  Car,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategories } from '@/features/search/hooks/use-search';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  photography: <Camera className="h-8 w-8" />,
  catering: <UtensilsCrossed className="h-8 w-8" />,
  venue: <Building2 className="h-8 w-8" />,
  decoration: <Palette className="h-8 w-8" />,
  music: <Music className="h-8 w-8" />,
  planning: <ClipboardList className="h-8 w-8" />,
  florist: <Flower2 className="h-8 w-8" />,
  transport: <Car className="h-8 w-8" />,
};

const FALLBACK_CATEGORIES = [
  { slug: 'photography', name: 'categories.photography', vendorCount: 120, description: 'categories.photographyDesc' },
  { slug: 'catering', name: 'categories.catering', vendorCount: 85, description: 'categories.cateringDesc' },
  { slug: 'venue', name: 'categories.venue', vendorCount: 64, description: 'categories.venueDesc' },
  { slug: 'decoration', name: 'categories.decoration', vendorCount: 92, description: 'categories.decorationDesc' },
  { slug: 'music', name: 'categories.music', vendorCount: 73, description: 'categories.musicDesc' },
  { slug: 'planning', name: 'categories.planning', vendorCount: 48, description: 'categories.planningDesc' },
  { slug: 'florist', name: 'categories.florist', vendorCount: 56, description: 'categories.floristDesc' },
  { slug: 'transport', name: 'categories.transport', vendorCount: 31, description: 'categories.transportDesc' },
];

export function CategoriesPage() {
  const { t } = useTranslation();
  const { data: apiCategories, isLoading } = useCategories();

  const categories = apiCategories ?? FALLBACK_CATEGORIES;

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
          {Array.from({ length: 8 }).map((_, i) => (
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
            <Link key={cat.slug} to={`/search?category=${cat.slug}`}>
              <Card className="hover:shadow-lg transition-shadow hover:border-primary/50 h-full">
                <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {CATEGORY_ICONS[cat.slug] ?? <ClipboardList className="h-8 w-8" />}
                  </div>
                  <h3 className="font-semibold">
                    {t(cat.name, { defaultValue: cat.name })}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t('categories.vendorCount', { count: cat.vendorCount })}
                  </p>
                  {cat.description && (
                    <p className="text-xs text-muted-foreground">
                      {t(cat.description, { defaultValue: cat.description })}
                    </p>
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
