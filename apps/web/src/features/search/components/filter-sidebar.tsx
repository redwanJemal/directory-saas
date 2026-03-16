import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useCategories } from '../hooks/use-search';
import type { SearchParams } from '../types';

interface FilterSidebarProps {
  params: SearchParams;
  onChange: (params: Partial<SearchParams>) => void;
  onClear: () => void;
}

const STYLES = ['elegant', 'modern', 'rustic', 'bohemian', 'classic', 'minimalist'];
const LANGUAGES = ['english', 'amharic', 'oromo', 'tigrinya', 'somali'];

export function FilterSidebar({ params, onChange, onClear }: FilterSidebarProps) {
  const { t } = useTranslation();
  const { data: categories } = useCategories();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{t('search.filters')}</h3>
        <Button variant="ghost" size="sm" onClick={onClear}>
          {t('search.clearFilters')}
        </Button>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label>{t('search.category')}</Label>
        <Select
          value={params.category ?? ''}
          onValueChange={(value) => onChange({ category: value || undefined })}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('search.category')} />
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
      </div>

      {/* Budget Range */}
      <div className="space-y-2">
        <Label>{t('search.budget')}</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder={t('search.minPrice')}
            value={params.minBudget ?? ''}
            onChange={(e) =>
              onChange({ minBudget: e.target.value ? Number(e.target.value) : undefined })
            }
          />
          <Input
            type="number"
            placeholder={t('search.maxPrice')}
            value={params.maxBudget ?? ''}
            onChange={(e) =>
              onChange({ maxBudget: e.target.value ? Number(e.target.value) : undefined })
            }
          />
        </div>
      </div>

      {/* Rating */}
      <div className="space-y-2">
        <Label>{t('search.rating')}</Label>
        <RadioGroup
          value={String(params.minRating ?? '')}
          onValueChange={(value) => onChange({ minRating: value ? Number(value) : undefined })}
        >
          {[
            { value: '', label: t('search.anyRating') },
            { value: '3', label: '3+' },
            { value: '4', label: '4+' },
            { value: '4.5', label: '4.5+' },
          ].map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem value={option.value} id={`rating-${option.value}`} />
              <Label htmlFor={`rating-${option.value}`} className="font-normal">
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Styles */}
      <div className="space-y-2">
        <Label>{t('search.style')}</Label>
        <div className="space-y-2">
          {STYLES.map((style) => (
            <div key={style} className="flex items-center space-x-2">
              <Checkbox
                id={`style-${style}`}
                checked={params.styles?.includes(style) ?? false}
                onCheckedChange={(checked) => {
                  const current = params.styles ?? [];
                  onChange({
                    styles: checked
                      ? [...current, style]
                      : current.filter((s) => s !== style),
                  });
                }}
              />
              <Label htmlFor={`style-${style}`} className="font-normal capitalize">
                {t(`styles.${style}`)}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Languages */}
      <div className="space-y-2">
        <Label>{t('search.languages')}</Label>
        <div className="space-y-2">
          {LANGUAGES.map((lang) => (
            <div key={lang} className="flex items-center space-x-2">
              <Checkbox
                id={`lang-${lang}`}
                checked={params.languages?.includes(lang) ?? false}
                onCheckedChange={(checked) => {
                  const current = params.languages ?? [];
                  onChange({
                    languages: checked
                      ? [...current, lang]
                      : current.filter((l) => l !== lang),
                  });
                }}
              />
              <Label htmlFor={`lang-${lang}`} className="font-normal capitalize">
                {t(`languages.${lang}`)}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
