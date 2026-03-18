import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCategories } from '../hooks/use-search';
import { useDebounce } from '@/hooks/use-debounce';

interface SearchBarProps {
  compact?: boolean;
  onSearch?: (query: string) => void;
  defaultValue?: string;
}

export function SearchBar({
  compact = false,
  onSearch,
  defaultValue = '',
}: SearchBarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState(defaultValue);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debouncedQuery = useDebounce(query, 200);
  const { data: categories } = useCategories();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const suggestions = debouncedQuery.length >= 2
    ? (categories ?? [])
        .filter((cat) =>
          cat.name.toLowerCase().includes(debouncedQuery.toLowerCase()),
        )
        .slice(0, 5)
    : [];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (onSearch) {
      onSearch(query);
      return;
    }
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    navigate(`/search?${params}`);
  };

  const handleSuggestionClick = (slug: string) => {
    setShowSuggestions(false);
    setQuery('');
    navigate(`/search?category=${slug}`);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <form onSubmit={handleSubmit}>
        <div className={`flex gap-2 ${compact ? '' : 'bg-card rounded-xl p-2 shadow-lg border'}`}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('search.searchBusinesses')}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="pl-9 pr-8"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setShowSuggestions(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button type="submit" size={compact ? 'default' : 'lg'}>
            <Search className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{t('landing.searchButton')}</span>
          </Button>
        </div>
      </form>

      {/* Autocomplete suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border bg-popover shadow-lg">
          <div className="p-1">
            {suggestions.map((cat) => (
              <button
                key={cat.slug}
                type="button"
                onClick={() => handleSuggestionClick(cat.slug)}
                className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent text-left"
              >
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <span className="font-medium">{cat.name}</span>
                  <span className="text-muted-foreground ml-2">
                    {t('categories.vendorCount', { count: cat.vendorCount })}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
