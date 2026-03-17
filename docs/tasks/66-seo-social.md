# Task 66: SEO & Social Sharing

## Summary
Optimize for search engines and social sharing. Server-side meta tags, structured data, sitemap, and social cards.

## Required Changes
- Dynamic `<title>` and `<meta>` tags per page (react-helmet-async or similar)
- Structured data: LocalBusiness schema (JSON-LD) on business profile pages
- Dynamic OG tags per business: og:title, og:description, og:image (cover photo)
- Twitter card meta tags
- XML sitemap generation (categories, cities, business profiles)
- robots.txt configuration
- Canonical URLs
- Prerender/SSR consideration for critical pages (or prerender.io integration)

## Acceptance Criteria
- [ ] Business pages have proper meta tags and structured data
- [ ] Social sharing shows business name, image, description
- [ ] Sitemap generated with all public pages
- [ ] robots.txt configured correctly
