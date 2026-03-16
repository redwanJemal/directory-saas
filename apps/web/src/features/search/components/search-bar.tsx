import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCategories } from '../hooks/use-search';

interface SearchBarProps {
  defaultCategory?: string;
  defaultLocation?: string;
  compact?: boolean;
  onSearch?: (params: { category: string; location: string }) => void;
}

export function SearchBar({
  defaultCategory = '',
  defaultLocation = '',
  compact = false,
  onSearch,
}: SearchBarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [category, setCategory] = useState(defaultCategory);
  const [location, setLocation] = useState(defaultLocation);
  const { data: categories } = useCategories();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch({ category, location });
      return;
    }
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (location) params.set('location', location);
    navigate(`/search?${params}`);
  };

  return (
    <form onSubmit={handleSearch}>
      <div
        className={`flex ${compact ? 'flex-row' : 'flex-col sm:flex-row'} gap-2 ${compact ? '' : 'bg-card rounded-xl p-2 shadow-lg border'}`}
      >
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder={t('landing.searchCategory')} />
          </SelectTrigger>
          <SelectContent>
            {categories?.map((cat) => (
              <SelectItem key={cat.slug} value={cat.slug}>
                {cat.name}
              </SelectItem>
            )) ?? (
              <>
                <SelectItem value="photography">{t('categories.photography')}</SelectItem>
                <SelectItem value="catering">{t('categories.catering')}</SelectItem>
                <SelectItem value="venue">{t('categories.venue')}</SelectItem>
                <SelectItem value="decoration">{t('categories.decoration')}</SelectItem>
                <SelectItem value="music">{t('categories.music')}</SelectItem>
                <SelectItem value="planning">{t('categories.planning')}</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
        <Input
          placeholder={t('landing.searchLocation')}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" size={compact ? 'default' : 'lg'}>
          <Search className="mr-2 h-4 w-4" />
          {t('landing.searchButton')}
        </Button>
      </div>
    </form>
  );
}
