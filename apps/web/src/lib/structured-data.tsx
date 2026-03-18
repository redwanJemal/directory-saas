import { Helmet } from 'react-helmet-async';
import type { VendorProfile } from '@/features/search/types';
import { brand } from './branding';
import { getCanonicalUrl } from './seo';

export function BusinessStructuredData({ vendor, vendorId }: { vendor: VendorProfile; vendorId: string }) {
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: vendor.name,
    description: vendor.description,
    url: getCanonicalUrl(`/business/${vendorId}`),
    address: {
      '@type': 'PostalAddress',
      addressLocality: vendor.city,
      addressCountry: vendor.country,
    },
  };

  if (vendor.coverPhoto) {
    jsonLd.image = vendor.coverPhoto;
  }

  if (vendor.contactPhone) {
    jsonLd.telephone = vendor.contactPhone;
  }

  if (vendor.contactEmail) {
    jsonLd.email = vendor.contactEmail;
  }

  if (vendor.reviewCount > 0) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: vendor.rating,
      reviewCount: vendor.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  // Price range from packages
  if (vendor.packages.length > 0) {
    const prices = vendor.packages.map((p) => p.price).filter((p) => p > 0);
    if (prices.length > 0) {
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      jsonLd.priceRange = minPrice === maxPrice
        ? `$${minPrice}`
        : `$${minPrice} - $${maxPrice}`;
    }
  }

  // Website / social links
  const sameAs: string[] = [];
  if (vendor.website) sameAs.push(vendor.website);
  if (vendor.instagram) sameAs.push(`https://instagram.com/${vendor.instagram.replace('@', '')}`);
  if (sameAs.length > 0) {
    jsonLd.sameAs = sameAs;
  }

  // Categories
  if (vendor.categories.length > 0) {
    jsonLd.additionalType = vendor.categories.map((c) => c.name);
  }

  // Business hours
  if (vendor.businessHours) {
    const dayMap: Record<string, string> = {
      monday: 'Monday',
      tuesday: 'Tuesday',
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
      saturday: 'Saturday',
      sunday: 'Sunday',
    };
    const hours: Record<string, unknown>[] = [];
    for (const [day, value] of Object.entries(vendor.businessHours)) {
      if (value && value.toLowerCase() !== 'closed' && dayMap[day]) {
        const parts = value.split('-').map((s) => s.trim());
        if (parts.length === 2) {
          hours.push({
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: dayMap[day],
            opens: parts[0],
            closes: parts[1],
          });
        }
      }
    }
    if (hours.length > 0) {
      jsonLd.openingHoursSpecification = hours;
    }
  }

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
    </Helmet>
  );
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

export function BreadcrumbStructuredData({ items }: { items: BreadcrumbItem[] }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: getCanonicalUrl(item.url),
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
    </Helmet>
  );
}

export function WebsiteStructuredData() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: brand.name,
    description: brand.description,
    url: getCanonicalUrl('/'),
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: getCanonicalUrl('/search?q={search_term_string}'),
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
    </Helmet>
  );
}
