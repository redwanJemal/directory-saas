import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ImageUpload } from '@/components/image-upload';
import { Loader2, X, Star, Search } from 'lucide-react';
import { profileSchema, type ProfileFormData } from '../schemas';
import {
  useProfileQuery,
  useUpdateProfileMutation,
  useProviderCategoriesQuery,
  useUpdateCategoriesMutation,
  useCategoryTreeQuery,
  useCountriesQuery,
  useCitiesQuery,
} from '../hooks/use-profile';
import type { CategoryOption } from '../types';

const MAX_CATEGORIES = 5;

function flattenCategories(categories: CategoryOption[]): CategoryOption[] {
  const result: CategoryOption[] = [];
  for (const cat of categories) {
    result.push(cat);
    if (cat.children) {
      result.push(...cat.children);
    }
  }
  return result;
}

export function GeneralInfoTab() {
  const { t } = useTranslation();
  const { data: profile, isLoading } = useProfileQuery();
  const updateMutation = useUpdateProfileMutation();
  const { data: providerCategories } = useProviderCategoriesQuery();
  const updateCategoriesMutation = useUpdateCategoriesMutation();
  const { data: categoryTree } = useCategoryTreeQuery();
  const { data: countries } = useCountriesQuery();

  const [form, setForm] = useState<ProfileFormData>({
    businessName: '',
    description: '',
    category: '',
    location: '',
    city: '',
    state: '',
    country: '',
    styles: [],
    languages: [],
    phone: '',
    email: '',
    website: '',
    whatsapp: '',
    instagram: '',
    tiktok: '',
  });
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [coverPhotoUrl, setCoverPhotoUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [styleInput, setStyleInput] = useState('');
  const [langInput, setLangInput] = useState('');

  // Category selection state
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [primaryCategoryId, setPrimaryCategoryId] = useState<string>('');
  const [categorySearch, setCategorySearch] = useState('');

  const { data: cities } = useCitiesQuery(form.country || undefined);

  useEffect(() => {
    if (profile) {
      setForm({
        businessName: profile.businessName || '',
        description: profile.description || '',
        category: profile.category || '',
        location: profile.location || '',
        city: profile.city || '',
        state: profile.state || '',
        country: profile.country || '',
        styles: profile.styles || [],
        languages: profile.languages || [],
        phone: profile.phone || '',
        email: profile.email || '',
        website: profile.website || '',
        whatsapp: profile.whatsapp || '',
        instagram: profile.instagram || '',
        tiktok: profile.tiktok || '',
      });
      setLogoUrl(profile.logoUrl);
      setCoverPhotoUrl(profile.coverPhotoUrl);
    }
  }, [profile]);

  useEffect(() => {
    if (providerCategories) {
      setSelectedCategoryIds(providerCategories.map((c) => c.id));
      const primary = providerCategories.find((c) => c.isPrimary);
      if (primary) setPrimaryCategoryId(primary.id);
    }
  }, [providerCategories]);

  const allCategories = categoryTree ? flattenCategories(categoryTree) : [];
  const filteredCategories = categorySearch
    ? allCategories.filter((c) =>
        c.name.toLowerCase().includes(categorySearch.toLowerCase()),
      )
    : allCategories;

  function toggleCategory(id: string) {
    setSelectedCategoryIds((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((cid) => cid !== id);
        if (primaryCategoryId === id && next.length > 0) {
          setPrimaryCategoryId(next[0]);
        } else if (next.length === 0) {
          setPrimaryCategoryId('');
        }
        return next;
      }
      if (prev.length >= MAX_CATEGORIES) return prev;
      const next = [...prev, id];
      if (!primaryCategoryId) setPrimaryCategoryId(id);
      return next;
    });
  }

  function setPrimary(id: string) {
    if (selectedCategoryIds.includes(id)) {
      setPrimaryCategoryId(id);
    }
  }

  function updateField<K extends keyof ProfileFormData>(key: K, value: ProfileFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function addTag(field: 'styles' | 'languages', value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    const current = form[field] ?? [];
    if (!current.includes(trimmed)) {
      updateField(field, [...current, trimmed]);
    }
  }

  function removeTag(field: 'styles' | 'languages', index: number) {
    const current = form[field] ?? [];
    updateField(
      field,
      current.filter((_, i) => i !== index),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const result = profileSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0]?.toString();
        if (key) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    try {
      await updateMutation.mutateAsync({
        ...result.data,
        logoUrl,
        coverPhotoUrl,
      } as Partial<import('../types').ProviderProfile>);

      if (selectedCategoryIds.length > 0) {
        await updateCategoriesMutation.mutateAsync({
          categoryIds: selectedCategoryIds,
          primaryCategoryId: primaryCategoryId || selectedCategoryIds[0],
        });
      }

      toast.success(t('profile.saved'));
    } catch {
      toast.error(t('errors.serverError'));
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('profile.generalInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="businessName">{t('profile.businessName')}</Label>
              <Input
                id="businessName"
                value={form.businessName}
                onChange={(e) => updateField('businessName', e.target.value)}
              />
              {errors.businessName && (
                <p className="text-sm text-destructive">{errors.businessName}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('profile.description')}</Label>
            <Textarea
              id="description"
              value={form.description ?? ''}
              onChange={(e) => updateField('description', e.target.value)}
              rows={4}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
          </div>

          {/* Multi-Category Selector */}
          <div className="space-y-3">
            <Label>{t('profile.categories')}</Label>
            <p className="text-sm text-muted-foreground">
              {t('profile.categoriesHint', { max: MAX_CATEGORIES })}
            </p>

            {selectedCategoryIds.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedCategoryIds.map((id) => {
                  const cat = allCategories.find((c) => c.id === id);
                  if (!cat) return null;
                  return (
                    <Badge
                      key={id}
                      variant={primaryCategoryId === id ? 'default' : 'secondary'}
                      className="gap-1 cursor-pointer"
                    >
                      {primaryCategoryId === id && (
                        <Star className="h-3 w-3 fill-current" />
                      )}
                      {cat.name}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCategory(id);
                        }}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                placeholder={t('profile.searchCategories')}
                className="pl-9"
              />
            </div>

            <div className="max-h-48 overflow-y-auto rounded-md border border-border p-2 space-y-1">
              {filteredCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between rounded px-2 py-1.5 hover:bg-muted"
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedCategoryIds.includes(cat.id)}
                      onCheckedChange={() => toggleCategory(cat.id)}
                      disabled={
                        !selectedCategoryIds.includes(cat.id) &&
                        selectedCategoryIds.length >= MAX_CATEGORIES
                      }
                    />
                    <span className="text-sm">{cat.name}</span>
                  </div>
                  {selectedCategoryIds.includes(cat.id) && (
                    <Button
                      type="button"
                      variant={primaryCategoryId === cat.id ? 'default' : 'ghost'}
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => setPrimary(cat.id)}
                    >
                      {primaryCategoryId === cat.id
                        ? t('profile.primaryCategory')
                        : t('profile.setAsPrimary')}
                    </Button>
                  )}
                </div>
              ))}
              {filteredCategories.length === 0 && (
                <p className="text-sm text-muted-foreground py-2 text-center">
                  {t('common.noResults')}
                </p>
              )}
            </div>
          </div>

          {/* Country / City Picker */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="country">{t('profile.country')}</Label>
              <Select
                value={form.country || ''}
                onValueChange={(v) => {
                  updateField('country', v);
                  updateField('city', '');
                }}
              >
                <SelectTrigger id="country">
                  <SelectValue placeholder={t('profile.selectCountry')} />
                </SelectTrigger>
                <SelectContent>
                  {countries?.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">{t('profile.city')}</Label>
              <Select
                value={form.city || ''}
                onValueChange={(v) => updateField('city', v)}
                disabled={!form.country}
              >
                <SelectTrigger id="city">
                  <SelectValue placeholder={t('profile.selectCity')} />
                </SelectTrigger>
                <SelectContent>
                  {cities?.map((c) => (
                    <SelectItem key={c.name} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">{t('profile.location')}</Label>
              <Input
                id="location"
                value={form.location ?? ''}
                onChange={(e) => updateField('location', e.target.value)}
                placeholder={t('profile.locationPlaceholder')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('profile.styles')}</Label>
            <div className="flex flex-wrap gap-2">
              {(form.styles ?? []).map((style, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground"
                >
                  {style}
                  <button
                    type="button"
                    onClick={() => removeTag('styles', i)}
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={styleInput}
                onChange={(e) => setStyleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag('styles', styleInput);
                    setStyleInput('');
                  }
                }}
                placeholder={t('profile.addStyle')}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  addTag('styles', styleInput);
                  setStyleInput('');
                }}
              >
                {t('common.create')}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('profile.languages')}</Label>
            <div className="flex flex-wrap gap-2">
              {(form.languages ?? []).map((lang, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground"
                >
                  {lang}
                  <button
                    type="button"
                    onClick={() => removeTag('languages', i)}
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={langInput}
                onChange={(e) => setLangInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag('languages', langInput);
                    setLangInput('');
                  }
                }}
                placeholder={t('profile.addLanguage')}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  addTag('languages', langInput);
                  setLangInput('');
                }}
              >
                {t('common.create')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('profile.mediaUpload')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('profile.logo')}</Label>
              <ImageUpload
                currentUrl={logoUrl}
                onUpload={setLogoUrl}
                onRemove={() => setLogoUrl(null)}
                className="w-40"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('profile.coverPhoto')}</Label>
              <ImageUpload
                currentUrl={coverPhotoUrl}
                onUpload={setCoverPhotoUrl}
                onRemove={() => setCoverPhotoUrl(null)}
                aspectRatio="wide"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>{t('profile.contactInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="phone">{t('profile.phone')}</Label>
              <Input
                id="phone"
                value={form.phone ?? ''}
                onChange={(e) => updateField('phone', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                value={form.email ?? ''}
                onChange={(e) => updateField('email', e.target.value)}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">{t('profile.website')}</Label>
              <Input
                id="website"
                value={form.website ?? ''}
                onChange={(e) => updateField('website', e.target.value)}
              />
              {errors.website && (
                <p className="text-sm text-destructive">{errors.website}</p>
              )}
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="whatsapp">{t('profile.whatsapp')}</Label>
              <Input
                id="whatsapp"
                value={form.whatsapp ?? ''}
                onChange={(e) => updateField('whatsapp', e.target.value)}
                placeholder={t('profile.whatsappPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram">{t('profile.instagram')}</Label>
              <Input
                id="instagram"
                value={form.instagram ?? ''}
                onChange={(e) => updateField('instagram', e.target.value)}
                placeholder={t('profile.instagramPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tiktok">{t('profile.tiktok')}</Label>
              <Input
                id="tiktok"
                value={form.tiktok ?? ''}
                onChange={(e) => updateField('tiktok', e.target.value)}
                placeholder={t('profile.tiktokPlaceholder')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={updateMutation.isPending || updateCategoriesMutation.isPending}
        >
          {(updateMutation.isPending || updateCategoriesMutation.isPending) && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {t('common.save')}
        </Button>
      </div>
    </form>
  );
}
