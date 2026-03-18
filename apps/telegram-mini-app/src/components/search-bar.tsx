import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  initialQuery?: string;
}

export function SearchBar({ onSearch, initialQuery = '' }: SearchBarProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--tg-theme-hint-color,var(--muted-foreground))]" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('search.placeholder')}
        className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--tg-theme-secondary-bg-color,var(--card))] text-[var(--tg-theme-text-color,var(--foreground))] placeholder:text-[var(--tg-theme-hint-color,var(--muted-foreground))] outline-none text-sm"
      />
    </form>
  );
}
