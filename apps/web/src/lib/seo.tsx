import { Helmet } from 'react-helmet-async';
import { brand } from './branding';

export interface SeoProps {
  title?: string;
  description?: string;
  canonicalPath?: string;
  ogType?: 'website' | 'business.business' | 'article';
  ogImage?: string | null;
  ogImageAlt?: string;
  noIndex?: boolean;
}

const BASE_URL = import.meta.env.VITE_PUBLIC_URL || 'https://enathager.com';

export function getCanonicalUrl(path: string): string {
  const base = BASE_URL.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

export function Seo({
  title,
  description,
  canonicalPath,
  ogType = 'website',
  ogImage,
  ogImageAlt,
  noIndex = false,
}: SeoProps) {
  const fullTitle = title ? `${title} | ${brand.name}` : brand.name;
  const metaDescription = description || brand.description;
  const canonical = canonicalPath ? getCanonicalUrl(canonicalPath) : undefined;
  const imageUrl = ogImage?.startsWith('http') ? ogImage : ogImage ? getCanonicalUrl(ogImage) : undefined;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />

      {/* Canonical */}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content={ogType} />
      {canonical && <meta property="og:url" content={canonical} />}
      <meta property="og:site_name" content={brand.name} />
      {imageUrl && <meta property="og:image" content={imageUrl} />}
      {imageUrl && ogImageAlt && <meta property="og:image:alt" content={ogImageAlt} />}
      <meta property="og:locale" content="en_US" />
      <meta property="og:locale:alternate" content="am_ET" />
      <meta property="og:locale:alternate" content="ar_AE" />

      {/* Twitter Card */}
      <meta name="twitter:card" content={imageUrl ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      {imageUrl && <meta name="twitter:image" content={imageUrl} />}
      {imageUrl && ogImageAlt && <meta name="twitter:image:alt" content={ogImageAlt} />}

      {/* No index */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
    </Helmet>
  );
}
