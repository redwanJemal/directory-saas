# Task 37: Web App — Public Layout, Landing Page, Vendor Search

## Summary
Build the public-facing client web app: public layout with header/footer, hero landing page, vendor search with filters/sort/pagination, vendor profile page with portfolio/packages/reviews/FAQ, and category browsing. These are the unauthenticated pages that make up the marketplace experience.

## Current State
- Web app has shadcn/ui components (Task 28), i18n (Task 29), and auth (Task 30)
- App.tsx has placeholder routes (landing, login, register, protected dashboard)
- No public layout, no landing page, no search, no vendor profiles
- Backend endpoints available:
  - Search: `GET /api/v1/search/providers` (Meilisearch-backed with filters)
  - Providers: `GET /api/v1/providers/:id` (public profile)
  - Categories: `GET /api/v1/categories`
  - Inquiries: `POST /api/v1/inquiries`

## Required Changes

### 37.1 Install Dependencies

```bash
cd apps/web && npm install date-fns
```

### 37.2 Public Layout

Create `apps/web/src/components/layout/public-layout.tsx`:

```typescript
import { Outlet } from 'react-router';
import { PublicHeader } from './public-header';
import { PublicFooter } from './public-footer';

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
```

### 37.3 Public Header

Create `apps/web/src/components/layout/public-header.tsx`:

```typescript
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuthStore } from '@/stores/auth-store';
import { brand } from '@/lib/branding';

export function PublicHeader() {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuthStore();

  const navLinks = [
    { label: t('nav.search'), href: '/search' },
    { label: t('nav.categories'), href: '/categories' },
    { label: t('nav.howItWorks'), href: '/#how-it-works' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            {brand.shortName}
          </div>
          <span className="font-semibold text-lg hidden sm:inline">{brand.name}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link key={link.href} to={link.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <Button variant="default" asChild>
                <Link to="/dashboard">{t('nav.dashboard')}</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login">{t('nav.login')}</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">{t('nav.signUp')}</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>{brand.name}</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-6">
                {navLinks.map((link) => (
                  <Link key={link.href} to={link.href} className="text-sm font-medium">
                    {link.label}
                  </Link>
                ))}
                <div className="border-t pt-4 flex flex-col gap-2">
                  {isAuthenticated ? (
                    <Button asChild><Link to="/dashboard">{t('nav.dashboard')}</Link></Button>
                  ) : (
                    <>
                      <Button variant="outline" asChild><Link to="/login">{t('nav.login')}</Link></Button>
                      <Button asChild><Link to="/register">{t('nav.signUp')}</Link></Button>
                    </>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
```

### 37.4 Public Footer

Create `apps/web/src/components/layout/public-footer.tsx`:

- Container with 3-4 column grid (responsive)
- Column 1: brand logo + description
- Column 2: Quick Links (Search, Categories, How It Works)
- Column 3: Legal (Privacy Policy, Terms of Service, Contact)
- Column 4: Social icons (placeholder links)
- Bottom bar: copyright text

### 37.5 Landing Page

Create `apps/web/src/features/landing/landing-page.tsx`:

**Hero Section**:
- Full-width background (gradient using brand colors)
- Large headline: `t('landing.heroTitle')`
- Subheadline: `t('landing.heroSubtitle')`
- Search bar: 3 inline fields (Category select, Location input, Date input) + Search button
- Search form submits to `/search?category=X&location=Y&date=Z`

```typescript
function HeroSection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (location) params.set('location', location);
    navigate(`/search?${params}`);
  };

  return (
    <section className="relative bg-gradient-to-br from-primary/10 via-background to-primary/5 py-20 md:py-32">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">{t('landing.heroTitle')}</h1>
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
                {/* Categories populated from API or static list */}
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
```

**Featured Vendors Section**:
- Grid of 4-6 vendor cards (fetched from API or placeholder data)
- Each card: image, name, category, location, rating stars, starting price
- "View All" link to search page

**How It Works Section**:
- 3 cards in a row: Search, Compare, Book
- Each card: icon (from Lucide), title, description
- Animated or styled step numbers

**Categories Section**:
- Grid of category cards (8-12 categories)
- Each card: icon, category name, vendor count
- Click navigates to `/search?category=X`

**Testimonials Section**:
- 3 testimonial cards
- Each: quote text, customer name, photo (placeholder avatar)
- Styled with quote marks

**CTA Section**:
- Background gradient
- Headline + subtitle + large CTA button
- Button links to `/register`

### 37.6 Vendor Search Page

Create `apps/web/src/features/search/`:
```
features/search/
├── vendor-search-page.tsx
├── types.ts
├── hooks/
│   └── use-search.ts
└── components/
    ├── search-bar.tsx
    ├── filter-sidebar.tsx
    ├── vendor-card.tsx
    └── search-results.tsx
```

**VendorSearchPage**:
- Search bar across top (category + location + date)
- Two-column layout (desktop): filter sidebar (left, 280px) + results grid (right)
- Mobile: filters in Sheet (triggered by "Filters" button)
- URL query params drive all state (synced with useState + useSearchParams)

**FilterSidebar**:
- Category: select dropdown (all categories)
- Budget Range: dual range slider (min/max) or two number inputs
- Rating: minimum rating (radio buttons: Any, 3+, 4+, 4.5+)
- Style Tags: checkbox list (Elegant, Modern, Rustic, Bohemian, etc.)
- Languages: checkbox list
- "Clear Filters" button
- On mobile: wrapped in Sheet component

**SearchBar** (reusable, shown on search page and landing page):
- Category select, Location input, optional date input
- Search button
- Compact variant for search results page header

**VendorCard**:
```typescript
function VendorCard({ vendor }: { vendor: VendorSearchResult }) {
  return (
    <Link to={`/vendors/${vendor.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="aspect-[4/3] relative overflow-hidden">
          <img src={vendor.coverPhoto || '/placeholder.jpg'} alt={vendor.name}
            className="object-cover w-full h-full" />
          {vendor.featured && (
            <Badge className="absolute top-2 left-2">Featured</Badge>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold truncate">{vendor.name}</h3>
          <p className="text-sm text-muted-foreground">{vendor.category} · {vendor.location}</p>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{vendor.rating.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({vendor.reviewCount})</span>
            </div>
            <span className="text-sm font-medium">
              {t('search.startingFrom', { price: formatCurrency(vendor.startingPrice) })}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
```

**SearchResults**:
- Header: result count, sort dropdown (Recommended, Rating, Price Low-High, Price High-Low, Most Reviewed)
- Grid: responsive (1 col mobile, 2 col tablet, 3 col desktop)
- Pagination at bottom
- Loading: skeleton grid (6 skeleton cards)
- Empty state: illustration + "No vendors found" + "Clear Filters" button
- Optional: Map/List view toggle (map view is placeholder — just show the toggle and a "Map coming soon" card)

**TanStack Query hook** (`use-search.ts`):
```typescript
export function useSearchQuery(params: SearchParams) {
  return useQuery({
    queryKey: ['vendor-search', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params.query) queryParams.set('q', params.query);
      if (params.category) queryParams.set('filter[category]', params.category);
      if (params.location) queryParams.set('filter[location]', params.location);
      if (params.minBudget) queryParams.set('filter[price][gte]', String(params.minBudget));
      if (params.maxBudget) queryParams.set('filter[price][lte]', String(params.maxBudget));
      if (params.minRating) queryParams.set('filter[rating][gte]', String(params.minRating));
      if (params.sort) queryParams.set('sort', params.sort);
      if (params.page) queryParams.set('page', String(params.page));
      if (params.pageSize) queryParams.set('pageSize', String(params.pageSize));

      const response = await api.get(`/search/providers?${queryParams}`);
      return response.data;
    },
    placeholderData: (prev) => prev, // Keep showing previous data while loading
  });
}
```

### 37.7 Vendor Profile Page

Create `apps/web/src/features/search/vendor-profile-page.tsx`:

- Route: `/vendors/:vendorId`
- Fetch vendor from `GET /api/v1/providers/:id`

**Hero section**:
- Cover photo (full-width, 300px height)
- Vendor name, category, location overlaid on cover
- Star rating + review count
- "Request Quote" CTA button

**Tabbed content** (Tabs component):

**About tab**:
- Description (rich text)
- Business info: styles, languages, contact
- Location info

**Portfolio tab**:
- Masonry-style image grid (CSS columns or grid with varying heights)
- Click image → lightbox (Dialog with large image, prev/next navigation)
- Simple lightbox implementation:
```typescript
function Lightbox({ images, currentIndex, onClose, onNext, onPrev }: LightboxProps) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0">
        <div className="relative">
          <img src={images[currentIndex].url} className="w-full max-h-[80vh] object-contain" />
          <Button variant="ghost" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2" onClick={onPrev}>
            <ChevronLeft />
          </Button>
          <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2" onClick={onNext}>
            <ChevronRight />
          </Button>
        </div>
        <div className="p-4">
          <p className="font-medium">{images[currentIndex].title}</p>
          <p className="text-sm text-muted-foreground">{images[currentIndex].description}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**Packages tab**:
- Package comparison cards (side by side on desktop, stacked on mobile)
- Each card: name, price, description, inclusions list (checkmarks)
- "Request Quote" button per package

**Reviews tab**:
- Rating summary (same component pattern as provider reviews)
- Review list: star rating, reviewer name, date, text
- Pagination for reviews

**FAQ tab**:
- Accordion component with question/answer pairs

**Sticky sidebar (desktop)**:
- Fixed position on right side
- "Request Quote" button
- Starting price display
- Response time indicator
- Contact info

**Inquiry Form Dialog** (opened by "Request Quote"):
- Form fields: event date (date picker), guest count (number), budget range (select), message (textarea)
- Zod validation
- Submit to `POST /api/v1/inquiries`
- Success message: "Inquiry sent! The vendor will respond shortly."

### 37.8 Categories Page

Create `apps/web/src/features/categories/categories-page.tsx`:

- Grid of category cards
- Each card: icon (Lucide icon mapped to category), category name, vendor count
- Click navigates to `/search?category=X`
- Fetch from `GET /api/v1/categories`

### 37.9 Update Routing

Update `apps/web/src/App.tsx`:

```typescript
import { Routes, Route, Navigate } from 'react-router';
import { PublicLayout } from '@/components/layout/public-layout';
import { LoginPage } from '@/features/auth/login-page';
import { RegisterPage } from '@/features/auth/register-page';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { LandingPage } from '@/features/landing/landing-page';
import { VendorSearchPage } from '@/features/search/vendor-search-page';
import { VendorProfilePage } from '@/features/search/vendor-profile-page';
import { CategoriesPage } from '@/features/categories/categories-page';

export default function App() {
  return (
    <Routes>
      {/* Public routes with PublicLayout */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/search" element={<VendorSearchPage />} />
        <Route path="/vendors/:vendorId" element={<VendorProfilePage />} />
        <Route path="/categories" element={<CategoriesPage />} />
      </Route>

      {/* Auth routes (no layout wrapper) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected dashboard routes (will be implemented in Task 38) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<div>Dashboard placeholder</div>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
```

### 37.10 Utility Functions

Create `apps/web/src/lib/format.ts`:

```typescript
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(date));
}

export function formatRelativeDate(date: string | Date): string {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days < 30) return rtf.format(-days, 'day');
  if (days < 365) return rtf.format(-Math.floor(days / 30), 'month');
  return rtf.format(-Math.floor(days / 365), 'year');
}
```

## Acceptance Criteria
- [ ] Public header: logo, nav links, auth buttons (Login/Sign Up or Dashboard if authenticated), mobile menu
- [ ] Public footer: brand info, quick links, legal links, copyright
- [ ] Landing page: hero with search bar, featured vendors, how it works, categories grid, testimonials, CTA
- [ ] Hero search bar navigates to search page with query params
- [ ] Vendor search: search bar, filter sidebar (category, budget, rating, style, languages), results grid
- [ ] Search: server-side filtering, sorting (5 options), pagination
- [ ] Search: loading skeletons, empty state with "No results" message
- [ ] Mobile search: filters open in Sheet
- [ ] Vendor cards: cover photo, name, category, location, rating, starting price
- [ ] Vendor profile page: hero with cover, tabbed content (About, Portfolio, Packages, Reviews, FAQ)
- [ ] Portfolio: masonry grid with lightbox
- [ ] Packages: comparison cards with inclusions
- [ ] Reviews: rating summary + review list
- [ ] FAQ: accordion
- [ ] Inquiry form: validates with Zod, submits to API, shows success message
- [ ] Categories page: grid of categories with vendor counts
- [ ] All URL query params synced with filters/search state
- [ ] All strings from i18n
- [ ] Responsive on mobile
- [ ] Web app builds with 0 errors

## Files to Create/Modify
- `apps/web/src/components/layout/public-layout.tsx` (create)
- `apps/web/src/components/layout/public-header.tsx` (create)
- `apps/web/src/components/layout/public-footer.tsx` (create)
- `apps/web/src/features/landing/landing-page.tsx` (create)
- `apps/web/src/features/search/vendor-search-page.tsx` (create)
- `apps/web/src/features/search/vendor-profile-page.tsx` (create)
- `apps/web/src/features/search/types.ts` (create)
- `apps/web/src/features/search/hooks/use-search.ts` (create)
- `apps/web/src/features/search/components/search-bar.tsx` (create)
- `apps/web/src/features/search/components/filter-sidebar.tsx` (create)
- `apps/web/src/features/search/components/vendor-card.tsx` (create)
- `apps/web/src/features/search/components/search-results.tsx` (create)
- `apps/web/src/features/search/components/lightbox.tsx` (create)
- `apps/web/src/features/search/components/inquiry-form-dialog.tsx` (create)
- `apps/web/src/features/categories/categories-page.tsx` (create)
- `apps/web/src/lib/format.ts` (create)
- `apps/web/src/App.tsx` (replace)

## Dependencies
- Task 28 (Frontend Shared Foundation) — shadcn/ui components
- Task 29 (Frontend i18n) — translation strings
- Task 30 (Frontend Auth) — auth store, login/register pages
