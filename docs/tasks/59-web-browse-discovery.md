# Task 59: Web App — Browse & Discovery

## Summary
Build category pages, city pages, deals page, and discovery features to help users browse and find businesses.

## Required Changes

### 59.1 Category Page (`/categories/:slug`)
- Header with category icon, name, description, color
- Subcategory chips/tabs for filtering
- Business grid filtered to this category
- Breadcrumb: Home > Categories > Food & Drink > Restaurant

### 59.2 Categories Index (`/categories`)
- Grid of all top-level categories with icon, name, provider count, color
- Click navigates to category page

### 59.3 City Page (`/city/:country/:city`)
- "Ethiopian Businesses in Dubai" header
- Category filter tabs
- Business grid filtered to this city
- Stats: total businesses, total reviews, new this month

### 59.4 Deals Page (`/deals`)
- All active deals with filters: country, city, category
- Deal cards: business name, deal title, discount %, original/deal price, expiry
- Sort: Newest, Ending Soon, Highest Discount

### 59.5 Recently Added (`/new`)
- Businesses added in last 30 days
- Simple chronological grid

### 59.6 Navigation Updates
- Add to header nav: Search, Categories, Deals, Cities
- Add country selector to header (remembers choice in localStorage)
- Footer with links to all city pages and top categories

## Acceptance Criteria
- [ ] Category pages with subcategory filtering
- [ ] City pages with category filter
- [ ] Deals page with active deals
- [ ] Recently added page
- [ ] Navigation updated with all new pages
- [ ] All pages have proper page titles and meta tags
