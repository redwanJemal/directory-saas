import { useState, useCallback } from 'react';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  Star,
  MapPin,
  Clock,
  Mail,
  Phone,
  Globe,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { useVendorProfile } from './hooks/use-search';
import { Lightbox } from './components/lightbox';
import { InquiryFormDialog } from './components/inquiry-form-dialog';
import { formatCurrency, formatRelativeDate } from '@/lib/format';
import type { VendorProfile } from './types';

export function VendorProfilePage() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const { t } = useTranslation();
  const { data: vendor, isLoading } = useVendorProfile(vendorId!);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | undefined>();

  if (isLoading) {
    return <VendorProfileSkeleton />;
  }

  if (!vendor) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">{t('errors.notFound')}</h1>
      </div>
    );
  }

  return (
    <div>
      {/* Hero */}
      <div className="relative h-48 md:h-72 bg-muted overflow-hidden">
        {vendor.coverPhoto ? (
          <img
            src={vendor.coverPhoto}
            alt={vendor.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary/20 to-primary/5" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="container mx-auto flex items-end justify-between">
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-foreground">
                {vendor.name}
              </h1>
              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                <span>{vendor.category}</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {vendor.location}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-primary text-primary" />
                  {vendor.rating.toFixed(1)} ({t('vendor.reviewCount', { count: vendor.reviewCount })})
                </span>
              </div>
            </div>
            <Button size="lg" className="hidden md:flex" onClick={() => setInquiryOpen(true)}>
              {t('vendor.requestQuote')}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Mobile CTA */}
        <Button className="w-full md:hidden mb-6" onClick={() => setInquiryOpen(true)}>
          {t('vendor.requestQuote')}
        </Button>

        <div className="flex gap-8">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            <Tabs defaultValue="about">
              <TabsList className="mb-6">
                <TabsTrigger value="about">{t('vendor.about')}</TabsTrigger>
                <TabsTrigger value="portfolio">{t('vendor.portfolio')}</TabsTrigger>
                <TabsTrigger value="packages">{t('vendor.packages')}</TabsTrigger>
                <TabsTrigger value="reviews">{t('vendor.reviews')}</TabsTrigger>
                <TabsTrigger value="faq">{t('vendor.faq')}</TabsTrigger>
              </TabsList>

              <TabsContent value="about">
                <AboutTab vendor={vendor} />
              </TabsContent>
              <TabsContent value="portfolio">
                <PortfolioTab vendor={vendor} />
              </TabsContent>
              <TabsContent value="packages">
                <PackagesTab
                  vendor={vendor}
                  onRequestQuote={(pkgId) => {
                    setSelectedPackageId(pkgId);
                    setInquiryOpen(true);
                  }}
                />
              </TabsContent>
              <TabsContent value="reviews">
                <ReviewsTab vendor={vendor} />
              </TabsContent>
              <TabsContent value="faq">
                <FaqTab vendor={vendor} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-[300px] shrink-0">
            <div className="sticky top-20 space-y-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t('vendor.startingFrom')}
                    </p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(vendor.startingPrice)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t('vendor.perEvent')}
                    </p>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {t('vendor.responseTime')}: {vendor.responseTime}
                    </span>
                  </div>
                  <Button className="w-full" onClick={() => setInquiryOpen(true)}>
                    {t('vendor.requestQuote')}
                  </Button>
                  <Separator />
                  <div className="space-y-2">
                    {vendor.contactEmail && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{vendor.contactEmail}</span>
                      </div>
                    )}
                    {vendor.contactPhone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{vendor.contactPhone}</span>
                      </div>
                    )}
                    {vendor.website && (
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={vendor.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate text-primary hover:underline"
                        >
                          {vendor.website}
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>
        </div>
      </div>

      <InquiryFormDialog
        vendorId={vendorId!}
        vendorName={vendor.name}
        packageId={selectedPackageId}
        open={inquiryOpen}
        onOpenChange={setInquiryOpen}
      />
    </div>
  );
}

function AboutTab({ vendor }: { vendor: VendorProfile }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground whitespace-pre-line">
          {vendor.description}
        </p>
      </div>
      {vendor.styles.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">{t('search.style')}</h3>
          <div className="flex flex-wrap gap-2">
            {vendor.styles.map((style) => (
              <Badge key={style} variant="secondary">
                {style}
              </Badge>
            ))}
          </div>
        </div>
      )}
      {vendor.languages.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">{t('search.languages')}</h3>
          <div className="flex flex-wrap gap-2">
            {vendor.languages.map((lang) => (
              <Badge key={lang} variant="outline">
                {lang}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PortfolioTab({ vendor }: { vendor: VendorProfile }) {
  const { t } = useTranslation();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const handlePrev = useCallback(() => {
    setLightboxIndex((prev) =>
      prev !== null ? (prev - 1 + vendor.portfolio.length) % vendor.portfolio.length : null,
    );
  }, [vendor.portfolio.length]);

  const handleNext = useCallback(() => {
    setLightboxIndex((prev) =>
      prev !== null ? (prev + 1) % vendor.portfolio.length : null,
    );
  }, [vendor.portfolio.length]);

  if (vendor.portfolio.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        {t('common.noResults')}
      </p>
    );
  }

  return (
    <>
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
        {vendor.portfolio.map((image, index) => (
          <button
            key={image.id}
            className="w-full overflow-hidden rounded-lg cursor-pointer break-inside-avoid"
            onClick={() => setLightboxIndex(index)}
          >
            <img
              src={image.url}
              alt={image.title}
              className="w-full object-cover hover:opacity-90 transition-opacity"
            />
          </button>
        ))}
      </div>
      {lightboxIndex !== null && (
        <Lightbox
          images={vendor.portfolio}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={handlePrev}
          onNext={handleNext}
        />
      )}
    </>
  );
}

function PackagesTab({
  vendor,
  onRequestQuote,
}: {
  vendor: VendorProfile;
  onRequestQuote: (packageId: string) => void;
}) {
  const { t } = useTranslation();

  if (vendor.packages.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        {t('common.noResults')}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {vendor.packages.map((pkg) => (
        <Card
          key={pkg.id}
          className={pkg.popular ? 'border-primary ring-1 ring-primary' : ''}
        >
          {pkg.popular && (
            <div className="bg-primary text-primary-foreground text-center py-1 text-xs font-medium">
              {t('vendor.popular')}
            </div>
          )}
          <CardHeader>
            <CardTitle className="text-lg">{pkg.name}</CardTitle>
            <p className="text-2xl font-bold">{formatCurrency(pkg.price)}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{pkg.description}</p>
            <div>
              <p className="text-sm font-medium mb-2">{t('vendor.includes')}:</p>
              <ul className="space-y-1">
                {pkg.inclusions.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Button
              className="w-full"
              variant={pkg.popular ? 'default' : 'outline'}
              onClick={() => onRequestQuote(pkg.id)}
            >
              {t('vendor.requestQuote')}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ReviewsTab({ vendor }: { vendor: VendorProfile }) {
  const { t } = useTranslation();

  const ratingCounts = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: vendor.reviews.filter((r) => Math.round(r.rating) === stars).length,
  }));

  return (
    <div className="space-y-8">
      {/* Rating summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-4xl font-bold">{vendor.rating.toFixed(1)}</p>
              <div className="flex gap-0.5 mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.round(vendor.rating)
                        ? 'fill-primary text-primary'
                        : 'text-muted-foreground'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {t('vendor.reviewCount', { count: vendor.reviewCount })}
              </p>
            </div>
            <div className="flex-1 space-y-1">
              {ratingCounts.map(({ stars, count }) => (
                <div key={stars} className="flex items-center gap-2">
                  <span className="text-sm w-3">{stars}</span>
                  <Star className="h-3 w-3 fill-primary text-primary" />
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{
                        width: vendor.reviewCount > 0
                          ? `${(count / vendor.reviewCount) * 100}%`
                          : '0%',
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-6 text-right">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review list */}
      {vendor.reviews.length === 0 ? (
        <p className="text-center text-muted-foreground py-4">
          {t('common.noResults')}
        </p>
      ) : (
        <div className="space-y-4">
          {vendor.reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {review.authorName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">
                        {review.authorName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeDate(review.createdAt)}
                      </span>
                    </div>
                    <div className="flex gap-0.5 mt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < review.rating
                              ? 'fill-primary text-primary'
                              : 'text-muted-foreground'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {review.text}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function FaqTab({ vendor }: { vendor: VendorProfile }) {
  const { t } = useTranslation();

  if (vendor.faqs.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        {t('common.noResults')}
      </p>
    );
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      {vendor.faqs.map((faq) => (
        <AccordionItem key={faq.id} value={faq.id}>
          <AccordionTrigger>{faq.question}</AccordionTrigger>
          <AccordionContent>{faq.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

function VendorProfileSkeleton() {
  return (
    <div>
      <Skeleton className="h-48 md:h-72 w-full" />
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-full max-w-sm" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    </div>
  );
}
