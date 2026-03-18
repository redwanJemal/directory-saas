import { useState, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Seo } from '@/lib/seo';
import { BusinessStructuredData, BreadcrumbStructuredData } from '@/lib/structured-data';
import {
  Star,
  MapPin,
  Clock,
  Mail,
  Phone,
  Globe,
  Check,
  MessageCircle,
  BadgeCheck,
  Instagram,
  Percent,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useVendorProfile,
  useProviderReviews,
  useReviewSummary,
  useRelatedBusinesses,
  useRecordContactClick,
} from './hooks/use-search';
import { Lightbox } from './components/lightbox';
import { InquiryFormDialog } from './components/inquiry-form-dialog';
import { ReviewFormDialog } from './components/review-form-dialog';
import { ShareButton } from './components/share-button';
import { FloatingWhatsApp } from './components/floating-whatsapp';
import { formatCurrency, formatRelativeDate, formatDate } from '@/lib/format';
import { useAuthStore } from '@/stores/auth-store';
import type { VendorProfile, VendorDeal } from './types';

export function VendorProfilePage() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const { t } = useTranslation();
  const { data: vendor, isLoading } = useVendorProfile(vendorId!);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | undefined>();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

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

  const seoDescription = vendor.description
    ? vendor.description.slice(0, 160)
    : t('seo.businessDescription', { name: vendor.name, location: vendor.location });

  return (
    <div>
      <Seo
        title={vendor.name}
        description={seoDescription}
        canonicalPath={`/business/${vendorId}`}
        ogType="business.business"
        ogImage={vendor.coverPhoto}
        ogImageAlt={vendor.name}
      />
      <BusinessStructuredData vendor={vendor} vendorId={vendorId!} />
      <BreadcrumbStructuredData
        items={[
          { name: t('nav.home'), url: '/' },
          { name: vendor.categories[0]?.name || t('nav.categories'), url: `/categories/${vendor.categories[0]?.slug || ''}` },
          { name: vendor.name, url: `/business/${vendorId}` },
        ]}
      />

      {/* Hero */}
      <HeroSection vendor={vendor} />

      {/* Contact Bar */}
      <ContactBar
        vendor={vendor}
        onInquiry={() => setInquiryOpen(true)}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-10">
            {/* About */}
            <AboutSection vendor={vendor} />

            {/* Services/Packages */}
            {vendor.packages.length > 0 && (
              <PackagesSection
                vendor={vendor}
                onRequestQuote={(pkgId) => {
                  setSelectedPackageId(pkgId);
                  setInquiryOpen(true);
                }}
              />
            )}

            {/* Gallery */}
            {vendor.portfolio.length > 0 && (
              <GallerySection vendor={vendor} />
            )}

            {/* Business Hours */}
            {vendor.businessHours && Object.keys(vendor.businessHours).length > 0 && (
              <BusinessHoursSection businessHours={vendor.businessHours} />
            )}

            {/* Reviews */}
            <ReviewsSection
              vendorId={vendorId!}
              vendor={vendor}
              isAuthenticated={isAuthenticated}
              onWriteReview={() => setReviewOpen(true)}
            />

            {/* FAQs */}
            {vendor.faqs.length > 0 && <FaqSection vendor={vendor} />}

            {/* Active Deals */}
            {vendor.deals.length > 0 && <DealsSection deals={vendor.deals} />}

            {/* Related Businesses */}
            <RelatedBusinessesSection vendorId={vendorId!} />
          </div>

          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-[300px] shrink-0">
            <SidebarCard
              vendor={vendor}
              onInquiry={() => setInquiryOpen(true)}
            />
          </aside>
        </div>
      </div>

      {/* Floating WhatsApp */}
      {vendor.whatsappUrl && (
        <FloatingWhatsApp providerId={vendorId!} whatsappUrl={vendor.whatsappUrl} />
      )}

      {/* Dialogs */}
      <InquiryFormDialog
        vendorId={vendorId!}
        vendorName={vendor.name}
        packageId={selectedPackageId}
        open={inquiryOpen}
        onOpenChange={setInquiryOpen}
      />
      <ReviewFormDialog
        providerId={vendorId!}
        providerName={vendor.name}
        open={reviewOpen}
        onOpenChange={setReviewOpen}
      />
    </div>
  );
}

/* ====== Hero Section ====== */

function HeroSection({ vendor }: { vendor: VendorProfile }) {
  const { t } = useTranslation();

  return (
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
        <div className="container mx-auto">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-4xl font-bold text-foreground">
                  {vendor.name}
                </h1>
                {vendor.verified && (
                  <BadgeCheck className="h-6 w-6 text-primary" />
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {vendor.categories.map((cat) => (
                  <Badge
                    key={cat.id}
                    variant={cat.isPrimary ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {cat.name}
                  </Badge>
                ))}
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {vendor.location}
                </span>
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="h-3 w-3 fill-primary text-primary" />
                  {vendor.rating.toFixed(1)} ({t('vendor.reviewCount', { count: vendor.reviewCount })})
                </span>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <ShareButton businessName={vendor.name} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ====== Contact Bar ====== */

function ContactBar({ vendor, onInquiry }: { vendor: VendorProfile; onInquiry: () => void }) {
  const { t } = useTranslation();
  const recordClick = useRecordContactClick();
  const vendorId = vendor.id;

  const handleContactClick = (type: string, url: string) => {
    recordClick.mutate({ providerId: vendorId, type });
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          {vendor.whatsappUrl && (
            <Button
              className="bg-[oklch(0.55_0.18_145)] hover:bg-[oklch(0.50_0.18_145)] text-white"
              onClick={() => handleContactClick('whatsapp', vendor.whatsappUrl!)}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              {t('vendor.contactWhatsApp')}
            </Button>
          )}
          {vendor.contactPhone && (
            <Button
              variant="outline"
              onClick={() => handleContactClick('phone', `tel:${vendor.contactPhone}`)}
            >
              <Phone className="h-4 w-4 mr-2" />
              {t('vendor.callNow')}
            </Button>
          )}
          {vendor.contactEmail && (
            <Button
              variant="outline"
              onClick={() => handleContactClick('email', `mailto:${vendor.contactEmail}`)}
            >
              <Mail className="h-4 w-4 mr-2" />
              {t('vendor.emailUs')}
            </Button>
          )}
          {vendor.website && (
            <Button
              variant="outline"
              onClick={() => handleContactClick('website', vendor.website!)}
            >
              <Globe className="h-4 w-4 mr-2" />
              {t('vendor.visitWebsite')}
            </Button>
          )}
          {vendor.instagram && (
            <Button
              variant="outline"
              onClick={() => handleContactClick('instagram', `https://instagram.com/${vendor.instagram}`)}
            >
              <Instagram className="h-4 w-4 mr-2" />
              Instagram
            </Button>
          )}
          <div className="ml-auto flex items-center gap-2">
            <Button onClick={onInquiry}>
              {t('vendor.requestQuote')}
            </Button>
            <div className="md:hidden">
              <ShareButton businessName={vendor.name} variant="ghost" size="icon" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ====== About Section ====== */

function AboutSection({ vendor }: { vendor: VendorProfile }) {
  const { t } = useTranslation();

  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">{t('vendor.about')}</h2>
      <p className="text-muted-foreground whitespace-pre-line">{vendor.description}</p>
      {vendor.styles.length > 0 && (
        <div className="mt-4">
          <h3 className="font-medium mb-2">{t('search.style')}</h3>
          <div className="flex flex-wrap gap-2">
            {vendor.styles.map((style) => (
              <Badge key={style} variant="secondary">{style}</Badge>
            ))}
          </div>
        </div>
      )}
      {vendor.languages.length > 0 && (
        <div className="mt-4">
          <h3 className="font-medium mb-2">{t('search.languages')}</h3>
          <div className="flex flex-wrap gap-2">
            {vendor.languages.map((lang) => (
              <Badge key={lang} variant="outline">{lang}</Badge>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/* ====== Packages Section ====== */

function PackagesSection({
  vendor,
  onRequestQuote,
}: {
  vendor: VendorProfile;
  onRequestQuote: (packageId: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">{t('vendor.packages')}</h2>
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
              {pkg.inclusions.length > 0 && (
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
              )}
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
    </section>
  );
}

/* ====== Gallery Section ====== */

function GallerySection({ vendor }: { vendor: VendorProfile }) {
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

  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">{t('vendor.portfolio')}</h2>
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
    </section>
  );
}

/* ====== Business Hours Section ====== */

const DAYS_OF_WEEK = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
] as const;

function BusinessHoursSection({ businessHours }: { businessHours: Record<string, string> }) {
  const { t } = useTranslation();

  const today = DAYS_OF_WEEK[((new Date().getDay() + 6) % 7)];
  const currentHour = new Date().getHours();

  const isOpenNow = useMemo(() => {
    const todayHours = businessHours[today];
    if (!todayHours || todayHours.toLowerCase() === 'closed') return false;
    const match = todayHours.match(/(\d{1,2}):?(\d{2})?\s*-\s*(\d{1,2}):?(\d{2})?/);
    if (!match) return true; // If format is not parseable, assume open
    const openHour = parseInt(match[1], 10);
    const closeHour = parseInt(match[3], 10);
    return currentHour >= openHour && currentHour < closeHour;
  }, [businessHours, today, currentHour]);

  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xl font-semibold">{t('vendor.businessHours')}</h2>
        {isOpenNow ? (
          <Badge className="bg-[oklch(0.55_0.18_145)] text-white">
            {t('vendor.openNow')}
          </Badge>
        ) : (
          <Badge variant="secondary">{t('vendor.closed')}</Badge>
        )}
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            {DAYS_OF_WEEK.map((day) => {
              const hours = businessHours[day] || t('vendor.closed');
              const isToday = day === today;
              return (
                <div
                  key={day}
                  className={`flex justify-between text-sm py-1 ${
                    isToday ? 'font-semibold text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  <span className="capitalize">{t(`vendor.days.${day}`)}</span>
                  <span>{hours}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

/* ====== Reviews Section ====== */

function ReviewsSection({
  vendorId,
  vendor,
  isAuthenticated,
  onWriteReview,
}: {
  vendorId: string;
  vendor: VendorProfile;
  isAuthenticated: boolean;
  onWriteReview: () => void;
}) {
  const { t } = useTranslation();
  const [reviewPage, setReviewPage] = useState(1);
  const { data: reviewSummary } = useReviewSummary(vendorId);
  const { data: reviewsData } = useProviderReviews(vendorId, reviewPage);

  const summary = reviewSummary || {
    average: vendor.rating,
    total: vendor.reviewCount,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  };

  const reviews = reviewsData?.data || vendor.reviews;
  const pagination = reviewsData?.pagination;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{t('vendor.reviews')}</h2>
        {isAuthenticated ? (
          <Button variant="outline" onClick={onWriteReview}>
            <Star className="h-4 w-4 mr-2" />
            {t('vendor.writeReview')}
          </Button>
        ) : (
          <Button variant="outline" asChild>
            <Link to="/login">{t('vendor.loginToReview')}</Link>
          </Button>
        )}
      </div>

      {/* Rating summary */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-4xl font-bold">{summary.average.toFixed(1)}</p>
              <div className="flex gap-0.5 mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.round(summary.average)
                        ? 'fill-primary text-primary'
                        : 'text-muted-foreground'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {t('vendor.reviewCount', { count: summary.total })}
              </p>
            </div>
            <div className="flex-1 space-y-1">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = summary.distribution[stars] || 0;
                return (
                  <div key={stars} className="flex items-center gap-2">
                    <span className="text-sm w-3">{stars}</span>
                    <Star className="h-3 w-3 fill-primary text-primary" />
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{
                          width: summary.total > 0
                            ? `${(count / summary.total) * 100}%`
                            : '0%',
                        }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-6 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review list */}
      {reviews.length === 0 ? (
        <p className="text-center text-muted-foreground py-4">
          {t('vendor.noReviews')}
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
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
                      <span className="font-medium text-sm">{review.authorName}</span>
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
                    <p className="mt-2 text-sm text-muted-foreground">{review.text}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={reviewPage <= 1}
                onClick={() => setReviewPage((p) => p - 1)}
              >
                {t('common.back')}
              </Button>
              <span className="flex items-center text-sm text-muted-foreground px-2">
                {reviewPage} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={reviewPage >= pagination.totalPages}
                onClick={() => setReviewPage((p) => p + 1)}
              >
                {t('common.next')}
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/* ====== FAQ Section ====== */

function FaqSection({ vendor }: { vendor: VendorProfile }) {
  const { t } = useTranslation();

  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">{t('vendor.faq')}</h2>
      <Accordion type="single" collapsible className="w-full">
        {vendor.faqs.map((faq) => (
          <AccordionItem key={faq.id} value={faq.id}>
            <AccordionTrigger>{faq.question}</AccordionTrigger>
            <AccordionContent>{faq.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

/* ====== Deals Section ====== */

function DealsSection({ deals }: { deals: VendorDeal[] }) {
  const { t } = useTranslation();

  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">{t('vendor.activeDeals')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {deals.map((deal) => (
          <Card key={deal.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold">{deal.title}</h3>
                  {deal.description && (
                    <p className="text-sm text-muted-foreground mt-1">{deal.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    {deal.discountPercent && (
                      <Badge className="bg-destructive text-destructive-foreground">
                        <Percent className="h-3 w-3 mr-1" />
                        {deal.discountPercent}% {t('deals.off', { percent: '' }).replace('%', '').trim()}
                      </Badge>
                    )}
                    {deal.dealPrice != null && (
                      <span className="text-lg font-bold">
                        {formatCurrency(deal.dealPrice)}
                      </span>
                    )}
                    {deal.originalPrice != null && (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatCurrency(deal.originalPrice)}
                      </span>
                    )}
                  </div>
                  {deal.expiresAt && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {t('deals.expires', { date: formatDate(deal.expiresAt) })}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

/* ====== Related Businesses Section ====== */

function RelatedBusinessesSection({ vendorId }: { vendorId: string }) {
  const { t } = useTranslation();
  const { data: related, isLoading } = useRelatedBusinesses(vendorId);

  if (isLoading) {
    return (
      <section>
        <h2 className="text-xl font-semibold mb-4">{t('vendor.similarBusinesses')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      </section>
    );
  }

  if (!related || related.length === 0) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">{t('vendor.similarBusinesses')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {related.map((biz) => (
          <Link key={biz.id} to={`/business/${biz.id}`} className="block">
            <Card className="h-full hover:shadow-md transition-shadow overflow-hidden">
              <div className="h-32 bg-muted overflow-hidden">
                {biz.coverPhoto ? (
                  <img
                    src={biz.coverPhoto}
                    alt={biz.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-primary/20 to-primary/5" />
                )}
              </div>
              <CardContent className="pt-3 pb-4">
                <div className="flex items-center gap-1">
                  <h3 className="font-medium text-sm truncate">{biz.name}</h3>
                  {biz.verified && <BadgeCheck className="h-4 w-4 text-primary shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{biz.category}</p>
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{biz.location}</span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="h-3 w-3 fill-primary text-primary" />
                  <span className="text-xs">{biz.rating.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">
                    ({biz.reviewCount})
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ====== Sidebar Card ====== */

function SidebarCard({ vendor, onInquiry }: { vendor: VendorProfile; onInquiry: () => void }) {
  const { t } = useTranslation();
  const recordClick = useRecordContactClick();

  return (
    <div className="sticky top-20 space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">{t('vendor.startingFrom')}</p>
            <p className="text-2xl font-bold">{formatCurrency(vendor.startingPrice)}</p>
            <p className="text-sm text-muted-foreground">{t('vendor.perEvent')}</p>
          </div>
          <Separator />
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{t('vendor.responseTime')}: {vendor.responseTime}</span>
          </div>
          {vendor.whatsappUrl && (
            <Button
              className="w-full bg-[oklch(0.55_0.18_145)] hover:bg-[oklch(0.50_0.18_145)] text-white"
              onClick={() => {
                recordClick.mutate({ providerId: vendor.id, type: 'whatsapp' });
                window.open(vendor.whatsappUrl!, '_blank', 'noopener,noreferrer');
              }}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              {t('vendor.contactWhatsApp')}
            </Button>
          )}
          <Button className="w-full" variant="outline" onClick={onInquiry}>
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
  );
}

/* ====== Skeleton ====== */

function VendorProfileSkeleton() {
  return (
    <div>
      <Skeleton className="h-48 md:h-72 w-full" />
      <div className="h-14 border-b border-border" />
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-full max-w-xl" />
          <Skeleton className="h-4 w-full max-w-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    </div>
  );
}
