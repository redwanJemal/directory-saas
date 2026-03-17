# Task 57: Web App — Homepage & Search

## Summary
Redesign the consumer-facing web app homepage and search experience for Habesha Hub. Hero section with country/city selector, category grid with icons, featured businesses, and enhanced search results with location and category filters.

## Required Changes

### 57.1 Homepage Hero
- Large hero: "Find Ethiopian Businesses in [Country/City]"
- Country dropdown (6 countries) + City dropdown (dynamic based on country)
- Category quick-links below hero (icon grid of top-level categories)
- "Popular in Dubai" / "Popular in Riyadh" sections based on selected location

### 57.2 Category Grid
- Display top-level categories (7) as large icon cards with colors
- Click navigates to `/categories/:slug` showing subcategories + businesses
- Show provider count per category

### 57.3 Featured Businesses
- Section: "Featured Businesses" — businesses with isFeatured=true
- Card design: cover photo, name, primary category badge, city, rating, verified badge
- "View All" link to search page

### 57.4 Active Deals Section
- Section: "Today's Deals" on homepage
- Show active deals with discount badge, business name, expiry countdown
- Link to `/deals` page

### 57.5 Search Results Page (`/search`)
- Left sidebar filters: Category (multi-select), Country, City, Rating, Verified only, Has Deals
- Results grid: business cards with cover photo, name, categories, city, rating, verified badge
- Sort: Recommended, Rating (high-low), Newest, Name (A-Z)
- Pagination with page size selector
- Empty state: "No businesses found. Try adjusting your filters."
- URL params for shareable search: `?country=AE&city=Dubai&category=restaurant`

### 57.6 Search Bar
- Persistent search bar in header
- Searches business name, description, category
- Autocomplete suggestions (businesses + categories)

## Acceptance Criteria
- [ ] Homepage shows hero with country/city selector
- [ ] Category grid with icons, colors, and provider counts
- [ ] Featured businesses section with cards
- [ ] Deals section on homepage
- [ ] Search page with sidebar filters and grid results
- [ ] URL-driven search for shareable links
- [ ] All pages responsive (mobile-first)
