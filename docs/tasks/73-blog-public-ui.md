# Task 73: Blog — Public Web UI

## Summary
Build the public-facing blog pages on the web app. Blog listing, category pages, individual post pages with rich content rendering, and integration with the homepage.

## Required Changes

### 73.1 Blog Listing Page (`/blog`)
- Hero section: "Business Guides & Resources" title with subtitle
- Category filter tabs/chips (All, Business Guides, Country Guides, News, Tips, Success Stories, Legal)
- Country filter dropdown (optional)
- Blog post cards in grid (2 columns desktop, 1 mobile):
  - Cover image (aspect 16:9)
  - Category badge
  - Title (linked)
  - Excerpt (2-3 lines, truncated)
  - Author name, published date, read time, view count
  - Tags as small chips
- Pagination
- Scroll-reveal animations on cards (use motion utilities from lib/motion.tsx)

### 73.2 Blog Post Page (`/blog/:slug`)
- Cover image hero (full width, h-64 md:h-96) with gradient overlay
- Title, category badge, author, date, read time overlay on hero
- Content area: max-w-3xl, centered, prose styling for rendered markdown
  - Use a markdown renderer (e.g., react-markdown or dangerouslySetInnerHTML for simple HTML)
  - Style headings, paragraphs, lists, links, code blocks, blockquotes
- Tags section at bottom
- Share buttons (copy link, WhatsApp, Telegram)
- Related posts section (3 cards from same category)
- "Back to Blog" breadcrumb

### 73.3 Country Guide Pages
- When a blog post has a country set, show country flag/name badge
- Country guide index: `/blog/country/:code` — posts filtered by country
- Add "Country Guides" section to country landing pages

### 73.4 Homepage Integration
- Add "Latest from the Blog" section to landing page (after testimonials, before CTA)
- Show latest 3 published posts as horizontal cards
- Link to /blog

### 73.5 SEO
- Dynamic meta tags per blog post (title, description, og:image)
- JSON-LD Article structured data on post pages
- Add blog posts to sitemap

### 73.6 Navigation
- Add "Blog" to the public header navigation (between "Recently Added" and "Login")
- Add "Blog" link in footer under Quick Links

### 73.7 i18n
- All blog public strings in en.json, am.json, ar.json

## Acceptance Criteria
- [ ] Blog listing page with category/country filters
- [ ] Individual post page with rendered content
- [ ] Related posts section
- [ ] Blog section on homepage
- [ ] SEO meta tags and structured data
- [ ] Blog in navigation and footer
- [ ] Scroll-reveal animations
- [ ] All apps build successfully
