import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ImageUpload } from '@/components/image-upload';
import { Loader2, X } from 'lucide-react';
import { profileSchema, type ProfileFormData } from '../schemas';
import { useProfileQuery, useUpdateProfileMutation } from '../hooks/use-profile';

const CATEGORIES = [
  'photography',
  'videography',
  'catering',
  'venue',
  'decoration',
  'music',
  'planning',
  'makeup',
  'clothing',
  'invitation',
  'transportation',
  'other',
];

export function GeneralInfoTab() {
  const { t } = useTranslation();
  const { data: profile, isLoading } = useProfileQuery();
  const updateMutation = useUpdateProfileMutation();

  const [form, setForm] = useState<ProfileFormData>({
    businessName: '',
    description: '',
    category: '',
    location: '',
    city: '',
    state: '',
    styles: [],
    languages: [],
    phone: '',
    email: '',
    website: '',
  });
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [coverPhotoUrl, setCoverPhotoUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [styleInput, setStyleInput] = useState('');
  const [langInput, setLangInput] = useState('');

  useEffect(() => {
    if (profile) {
      setForm({
        businessName: profile.businessName || '',
        description: profile.description || '',
        category: profile.category || '',
        location: profile.location || '',
        city: profile.city || '',
        state: profile.state || '',
        styles: profile.styles || [],
        languages: profile.languages || [],
        phone: profile.phone || '',
        email: profile.email || '',
        website: profile.website || '',
      });
      setLogoUrl(profile.logoUrl);
      setCoverPhotoUrl(profile.coverPhotoUrl);
    }
  }, [profile]);

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
    updateField(field, current.filter((_, i) => i !== index));
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
      });
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
              {errors.businessName && <p className="text-sm text-destructive">{errors.businessName}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">{t('profile.category')}</Label>
              <Select value={form.category} onValueChange={(v) => updateField('category', v)}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
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
            {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="location">{t('profile.location')}</Label>
              <Input
                id="location"
                value={form.location ?? ''}
                onChange={(e) => updateField('location', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">{t('profile.city')}</Label>
              <Input id="city" value={form.city ?? ''} onChange={(e) => updateField('city', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">{t('profile.state')}</Label>
              <Input id="state" value={form.state ?? ''} onChange={(e) => updateField('state', e.target.value)} />
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
                  <button type="button" onClick={() => removeTag('styles', i)} className="hover:text-destructive">
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
                  <button type="button" onClick={() => removeTag('languages', i)} className="hover:text-destructive">
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
              <Input id="phone" value={form.phone ?? ''} onChange={(e) => updateField('phone', e.target.value)} />
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
              {errors.website && <p className="text-sm text-destructive">{errors.website}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('common.save')}
        </Button>
      </div>
    </form>
  );
}
