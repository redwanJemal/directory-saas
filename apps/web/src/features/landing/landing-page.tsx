import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Star,
  GitCompare,
  CalendarCheck,
  Camera,
  UtensilsCrossed,
  Building2,
  Palette,
  Music,
  ClipboardList,
  Flower2,
  Car,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategories, useSearchQuery } from '@/features/search/hooks/use-search';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  photography: <Camera className="h-6 w-6" />,
  catering: <UtensilsCrossed className="h-6 w-6" />,
  venue: <Building2 className="h-6 w-6" />,
  decoration: <Palette className="h-6 w-6" />,
  music: <Music className="h-6 w-6" />,
  planning: <ClipboardList className="h-6 w-6" />,
  florist: <Flower2 className="h-6 w-6" />,
  transport: <Car className="h-6 w-6" />,
};

const FALLBACK_CATEGORIES = [
  { slug: 'photography', name: 'categories.photography', vendorCount: 0 },
  { slug: 'catering', name: 'categories.catering', vendorCount: 0 },
  { slug: 'venue', name: 'categories.venue', vendorCount: 0 },
  { slug: 'decoration', name: 'categories.decoration', vendorCount: 0 },
  { slug: 'music', name: 'categories.music', vendorCount: 0 },
  { slug: 'planning', name: 'categories.planning', vendorCount: 0 },
  { slug: 'florist', name: 'categories.florist', vendorCount: 0 },
  { slug: 'transport', name: 'categories.transport', vendorCount: 0 },
];

export function LandingPage() {
  return (
    <>
      <HeroSection />
      <FeaturedVendorsSection />
      <HowItWorksSection />
      <CategoriesSection />
      <TestimonialsSection />
      <CtaSection />
    </>
  );
}

function HeroSection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const { data: categories } = useCategories();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (location) params.set('location', location);
    navigate(`/search?${params}`);
  };

  const categoryList = categories ?? FALLBACK_CATEGORIES;

  return (
    <section className="relative bg-gradient-to-br from-primary/10 via-background to-primary/5 py-20 md:py-32">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          {t('landing.heroTitle')}
        </h1>
        <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          {t('landing.heroSubtitle')}
        </p>
        <form onSubmit={handleSearch} className="mt-8 mx-auto max-w-3xl">
          <div className="flex flex-col sm:flex-row gap-2 bg-card rounded-xl p-2 shadow-lg border">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={t('landing.searchCategory')} />
              </SelectTrigger>
              <SelectContent>
                {categoryList.map((cat) => (
                  <SelectItem key={cat.slug} value={cat.slug}>
                    {t(cat.name, { defaultValue: cat.name })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder={t('landing.searchLocation')}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="lg">
              <Search className="mr-2 h-4 w-4" />
              {t('landing.searchButton')}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}

function FeaturedVendorsSection() {
  const { t } = useTranslation();

  const { data: searchData, isLoading } = useSearchQuery({
    sort: '-rating',
    pageSize: 4,
    page: 1,
  });

  const featured = searchData?.data ?? [];

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold">
            {t('landing.featuredVendors')}
          </h2>
          <Button variant="ghost" asChild>
            <Link to="/search">{t('common.viewAll')}</Link>
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
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-[4/3] bg-muted flex items-center justify-center">
                      <span className="text-4xl font-bold text-muted-foreground/20">
                        {vendor.name.charAt(0)}
                      </span>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold truncate">{vendor.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {vendor.category} · {vendor.location}
                      </p>
                      <div className="flex items-center gap-1 mt-2">
                        <Star className="h-4 w-4 fill-primary text-primary" />
                        <span className="text-sm font-medium">{vendor.rating}</span>
                        <span className="text-xs text-muted-foreground">
                          ({vendor.reviewCount})
                        </span>
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

function HowItWorksSection() {
  const { t } = useTranslation();

  const steps = [
    {
      icon: <Search className="h-8 w-8" />,
      title: t('landing.step1Title'),
      description: t('landing.step1Description'),
    },
    {
      icon: <GitCompare className="h-8 w-8" />,
      title: t('landing.step2Title'),
      description: t('landing.step2Description'),
    },
    {
      icon: <CalendarCheck className="h-8 w-8" />,
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

function CategoriesSection() {
  const { t } = useTranslation();
  const { data: apiCategories } = useCategories();

  const categories = apiCategories ?? FALLBACK_CATEGORIES;

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-12">
          {t('landing.categoriesTitle')}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link key={cat.slug} to={`/search?category=${cat.slug}`}>
              <Card className="hover:shadow-md transition-shadow hover:border-primary/50">
                <CardContent className="flex flex-col items-center gap-3 py-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {CATEGORY_ICONS[cat.slug] ?? <ClipboardList className="h-6 w-6" />}
                  </div>
                  <h3 className="font-medium text-sm">
                    {t(cat.name, { defaultValue: cat.name })}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {t('categories.vendorCount', { count: cat.vendorCount })}
                  </p>
                </CardContent>
              </Card>
            </Link>
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
    <section className="py-16 bg-muted/50">
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
        <h2 className="text-2xl md:text-4xl font-bold">{t('landing.ctaTitle')}</h2>
        <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
          {t('landing.ctaSubtitle')}
        </p>
        <Button size="lg" className="mt-8" asChild>
          <Link to="/register">{t('landing.ctaButton')}</Link>
        </Button>
      </div>
    </section>
  );
}
