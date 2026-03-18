import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Grid3X3, Tag, Home } from 'lucide-react';
import { getTelegramWebApp, parseStartParam, hapticFeedback } from '@/lib/telegram';
import { SearchBar } from '@/components/search-bar';
import { BusinessCard } from '@/components/business-card';
import { BusinessProfile } from '@/components/business-profile';
import { CategoryGrid } from '@/components/category-grid';
import { DealCard } from '@/components/deal-card';
import { LoadingSpinner } from '@/components/loading-spinner';
import {
  useSearchBusinesses,
  useFeaturedBusinesses,
  useCategories,
  useDeals,
} from '@/hooks/use-businesses';

type View = 'home' | 'search' | 'categories' | 'deals' | 'profile';

export default function App() {
  const { t } = useTranslation();
  const [view, setView] = useState<View>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBusinessSlug, setSelectedBusinessSlug] = useState<string | null>(null);

  const featured = useFeaturedBusinesses();
  const searchResults = useSearchBusinesses({
    q: searchQuery || undefined,
    category: selectedCategory || undefined,
  });
  const categories = useCategories();
  const deals = useDeals();

  // Handle deep links from start_param
  useEffect(() => {
    const param = parseStartParam();
    if (!param) return;

    switch (param.type) {
      case 'business':
        setSelectedBusinessSlug(param.value);
        setView('profile');
        break;
      case 'search':
        setSearchQuery(param.value);
        setView('search');
        break;
      case 'category':
        setSelectedCategory(param.value);
        setView('search');
        break;
      case 'deals':
        setView('deals');
        break;
    }
  }, []);

  // Telegram WebApp setup
  useEffect(() => {
    const webapp = getTelegramWebApp();
    if (webapp) {
      webapp.ready();
      webapp.expand();
    }
  }, []);

  // Back button handling
  const handleBack = useCallback(() => {
    hapticFeedback('light');
    if (view === 'profile') {
      setSelectedBusinessSlug(null);
      setView('home');
    } else {
      setView('home');
      setSearchQuery('');
      setSelectedCategory('');
    }
  }, [view]);

  useEffect(() => {
    const webapp = getTelegramWebApp();
    if (!webapp) return;

    if (view !== 'home') {
      webapp.BackButton.show();
      webapp.BackButton.onClick(handleBack);
    } else {
      webapp.BackButton.hide();
    }

    return () => {
      webapp.BackButton.offClick(handleBack);
    };
  }, [view, handleBack]);

  const navigateToBusiness = (slug: string) => {
    setSelectedBusinessSlug(slug);
    setView('profile');
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSelectedCategory('');
    setView('search');
  };

  const handleCategorySelect = (slug: string) => {
    setSelectedCategory(slug);
    setSearchQuery('');
    setView('search');
  };

  const changeView = (newView: View) => {
    hapticFeedback('light');
    setView(newView);
    if (newView !== 'search') {
      setSearchQuery('');
      setSelectedCategory('');
    }
    if (newView !== 'profile') {
      setSelectedBusinessSlug(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--tg-theme-bg-color,var(--background))] pb-16">
      {/* Content */}
      <div className="px-4 pt-4">
        {view === 'profile' && selectedBusinessSlug ? (
          <BusinessProfile vendorId={selectedBusinessSlug} onBack={handleBack} />
        ) : view === 'search' ? (
          <SearchView
            query={searchQuery}
            category={selectedCategory}
            onSearch={handleSearch}
            searchResults={searchResults}
            onBusinessClick={navigateToBusiness}
          />
        ) : view === 'categories' ? (
          <CategoriesView categories={categories} onSelect={handleCategorySelect} />
        ) : view === 'deals' ? (
          <DealsView deals={deals} onBusinessClick={navigateToBusiness} />
        ) : (
          <HomeView
            featured={featured}
            categories={categories}
            deals={deals}
            onSearch={handleSearch}
            onBusinessClick={navigateToBusiness}
            onCategorySelect={handleCategorySelect}
            onViewDeals={() => changeView('deals')}
          />
        )}
      </div>

      {/* Bottom Navigation */}
      {view !== 'profile' && (
        <nav className="fixed bottom-0 left-0 right-0 flex items-center justify-around py-2 px-4 bg-[var(--tg-theme-bg-color,var(--background))] border-t border-[var(--tg-theme-secondary-bg-color,var(--border))]">
          <NavButton
            icon={<Home className="h-5 w-5" />}
            label={t('nav.home')}
            active={view === 'home'}
            onClick={() => changeView('home')}
          />
          <NavButton
            icon={<Search className="h-5 w-5" />}
            label={t('nav.search')}
            active={view === 'search'}
            onClick={() => changeView('search')}
          />
          <NavButton
            icon={<Grid3X3 className="h-5 w-5" />}
            label={t('nav.categories')}
            active={view === 'categories'}
            onClick={() => changeView('categories')}
          />
          <NavButton
            icon={<Tag className="h-5 w-5" />}
            label={t('nav.deals')}
            active={view === 'deals'}
            onClick={() => changeView('deals')}
          />
        </nav>
      )}
    </div>
  );
}

function NavButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-colors ${
        active
          ? 'text-[var(--tg-theme-link-color,var(--primary))]'
          : 'text-[var(--tg-theme-hint-color,var(--muted-foreground))]'
      }`}
    >
      {icon}
      <span className="text-[10px]">{label}</span>
    </button>
  );
}

// === View Components ===

function HomeView({
  featured,
  categories,
  deals,
  onSearch,
  onBusinessClick,
  onCategorySelect,
  onViewDeals,
}: {
  featured: ReturnType<typeof useFeaturedBusinesses>;
  categories: ReturnType<typeof useCategories>;
  deals: ReturnType<typeof useDeals>;
  onSearch: (q: string) => void;
  onBusinessClick: (slug: string) => void;
  onCategorySelect: (slug: string) => void;
  onViewDeals: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center pt-2">
        <h1 className="text-xl font-bold text-[var(--tg-theme-text-color,var(--foreground))]">
          🇪🇹 {t('app.title')}
        </h1>
        <p className="text-sm text-[var(--tg-theme-hint-color,var(--muted-foreground))] mt-1">
          {t('app.subtitle')}
        </p>
      </div>

      {/* Search */}
      <SearchBar onSearch={onSearch} />

      {/* Categories */}
      {categories.data?.data && (
        <div>
          <h2 className="font-semibold text-[var(--tg-theme-text-color,var(--foreground))] mb-3">
            {t('nav.categories')}
          </h2>
          <CategoryGrid
            categories={categories.data.data}
            onSelect={onCategorySelect}
          />
        </div>
      )}

      {/* Deals */}
      {deals.data?.data?.items && deals.data.data.items.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-[var(--tg-theme-text-color,var(--foreground))]">
              {t('nav.deals')}
            </h2>
            <button
              onClick={onViewDeals}
              className="text-xs text-[var(--tg-theme-link-color,var(--primary))]"
            >
              {t('common.viewAll')}
            </button>
          </div>
          <div className="space-y-2">
            {deals.data.data.items.slice(0, 3).map((deal: { id: string; title: string; description?: string | null; discountPercent?: number | null; expiresAt?: string | null; providerProfile: { tenant: { name: string; slug: string }; city?: string | null } }) => (
              <DealCard
                key={deal.id}
                deal={deal}
                onBusinessClick={onBusinessClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* Featured */}
      {featured.isLoading ? (
        <LoadingSpinner />
      ) : featured.data?.data?.items && (
        <div>
          <h2 className="font-semibold text-[var(--tg-theme-text-color,var(--foreground))] mb-3">
            ⭐ Featured
          </h2>
          <div className="space-y-3">
            {featured.data.data.items.map((b: { id: string; tenant: { name: string; slug: string }; tagline?: string | null; coverImage?: string | null; city?: string | null; country?: string | null; isVerified?: boolean; averageRating?: number | null; reviewCount?: number; categories?: Array<{ category: { name: string; slug: string } }> }) => (
              <BusinessCard
                key={b.id}
                business={b}
                onClick={onBusinessClick}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SearchView({
  query,
  category,
  onSearch,
  searchResults,
  onBusinessClick,
}: {
  query: string;
  category: string;
  onSearch: (q: string) => void;
  searchResults: ReturnType<typeof useSearchBusinesses>;
  onBusinessClick: (slug: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <SearchBar onSearch={onSearch} initialQuery={query} />

      {(query || category) && (
        <p className="text-sm text-[var(--tg-theme-hint-color,var(--muted-foreground))]">
          {query
            ? t('search.results', { query })
            : `Category: ${category}`}
        </p>
      )}

      {searchResults.isLoading ? (
        <LoadingSpinner />
      ) : searchResults.data?.data?.items?.length > 0 ? (
        <div className="space-y-3">
          {searchResults.data.data.items.map((b: { id: string; tenant: { name: string; slug: string }; tagline?: string | null; coverImage?: string | null; city?: string | null; country?: string | null; isVerified?: boolean; averageRating?: number | null; reviewCount?: number; categories?: Array<{ category: { name: string; slug: string } }> }) => (
            <BusinessCard
              key={b.id}
              business={b}
              onClick={onBusinessClick}
            />
          ))}
        </div>
      ) : (query || category) ? (
        <p className="text-center text-sm text-[var(--tg-theme-hint-color,var(--muted-foreground))] py-8">
          {t('search.noResults')}
        </p>
      ) : null}
    </div>
  );
}

function CategoriesView({
  categories,
  onSelect,
}: {
  categories: ReturnType<typeof useCategories>;
  onSelect: (slug: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="text-lg font-bold text-[var(--tg-theme-text-color,var(--foreground))] mb-4">
        {t('categories.title')}
      </h1>
      {categories.isLoading ? (
        <LoadingSpinner />
      ) : categories.data?.data ? (
        <CategoryGrid categories={categories.data.data} onSelect={onSelect} />
      ) : null}
    </div>
  );
}

function DealsView({
  deals,
  onBusinessClick,
}: {
  deals: ReturnType<typeof useDeals>;
  onBusinessClick: (slug: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="text-lg font-bold text-[var(--tg-theme-text-color,var(--foreground))] mb-4">
        {t('deals.title')}
      </h1>
      {deals.isLoading ? (
        <LoadingSpinner />
      ) : deals.data?.data?.items?.length > 0 ? (
        <div className="space-y-2">
          {deals.data.data.items.map((deal: { id: string; title: string; description?: string | null; discountPercent?: number | null; expiresAt?: string | null; providerProfile: { tenant: { name: string; slug: string }; city?: string | null } }) => (
            <DealCard
              key={deal.id}
              deal={deal}
              onBusinessClick={onBusinessClick}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-sm text-[var(--tg-theme-hint-color,var(--muted-foreground))] py-8">
          {t('deals.noDeals')}
        </p>
      )}
    </div>
  );
}
