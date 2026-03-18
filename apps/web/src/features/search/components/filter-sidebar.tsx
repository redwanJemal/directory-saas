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
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useCategories, useCountries, useCities } from '../hooks/use-search';
import type { SearchParams } from '../types';

interface FilterSidebarProps {
  params: SearchParams;
  onChange: (params: Partial<SearchParams>) => void;
  onClear: () => void;
}

export function FilterSidebar({ params, onChange, onClear }: FilterSidebarProps) {
  const { t } = useTranslation();
  const { data: categories } = useCategories();
  const { data: countries } = useCountries();
  const { data: cities } = useCities(params.country);

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
          value={params.category ?? '__all__'}
          onValueChange={(value) => onChange({ category: value === '__all__' ? undefined : value })}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('search.allCategories')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{t('search.allCategories')}</SelectItem>
            {categories?.map((cat) => (
              <SelectItem key={cat.slug} value={cat.slug}>
                {cat.name}
                {cat.vendorCount > 0 && (
                  <span className="ml-1 text-muted-foreground">({cat.vendorCount})</span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Country */}
      <div className="space-y-2">
        <Label>{t('search.country')}</Label>
        <Select
          value={params.country ?? '__all__'}
          onValueChange={(value) =>
            onChange({
              country: value === '__all__' ? undefined : value,
              city: undefined,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder={t('search.allCountries')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{t('search.allCountries')}</SelectItem>
            {countries?.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* City */}
      <div className="space-y-2">
        <Label>{t('search.city')}</Label>
        <Select
          value={params.city ?? '__all__'}
          onValueChange={(value) => onChange({ city: value === '__all__' ? undefined : value })}
          disabled={!params.country}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('search.allCities')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{t('search.allCities')}</SelectItem>
            {cities?.map((c) => (
              <SelectItem key={c.name} value={c.name}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

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

      <Separator />

      {/* Verified Only */}
      <div className="flex items-center justify-between">
        <Label htmlFor="verified-toggle">{t('search.verifiedOnly')}</Label>
        <Switch
          id="verified-toggle"
          checked={params.verified ?? false}
          onCheckedChange={(checked) => onChange({ verified: checked || undefined })}
        />
      </div>

      {/* Has Deals */}
      <div className="flex items-center justify-between">
        <Label htmlFor="deals-toggle">{t('search.hasDeals')}</Label>
        <Switch
          id="deals-toggle"
          checked={params.hasDeals ?? false}
          onCheckedChange={(checked) => onChange({ hasDeals: checked || undefined })}
        />
      </div>

      <Separator />

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
    </div>
  );
}
