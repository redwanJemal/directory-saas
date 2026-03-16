import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { UpdateWeddingSchema } from '../schemas';
import { useUpdateWedding } from '../hooks/use-wedding';
import type { Wedding } from '../types';

const STYLE_OPTIONS = ['elegant', 'modern', 'rustic', 'bohemian', 'classic', 'minimalist'];

interface WeddingFormProps {
  wedding: Wedding | undefined;
}

export function WeddingForm({ wedding }: WeddingFormProps) {
  const { t } = useTranslation();
  const updateMutation = useUpdateWedding();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    title: '',
    date: '',
    estimatedGuests: '',
    venue: '',
    styles: [] as string[],
  });

  useEffect(() => {
    if (wedding) {
      setForm({
        title: wedding.title ?? '',
        date: wedding.date ? wedding.date.split('T')[0] : '',
        estimatedGuests: wedding.estimatedGuests?.toString() ?? '',
        venue: wedding.venue ?? '',
        styles: wedding.styles ?? [],
      });
    }
  }, [wedding]);

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  }

  function toggleStyle(style: string) {
    setForm((prev) => ({
      ...prev,
      styles: prev.styles.includes(style)
        ? prev.styles.filter((s) => s !== style)
        : [...prev.styles, style],
    }));
  }

  function handleSubmit() {
    const payload = {
      title: form.title,
      date: form.date,
      estimatedGuests: form.estimatedGuests ? Number(form.estimatedGuests) : undefined,
      venue: form.venue || undefined,
      styles: form.styles.length > 0 ? form.styles : undefined,
    };

    const result = UpdateWeddingSchema.safeParse(payload);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    updateMutation.mutate(result.data, {
      onSuccess: () => toast.success(t('common.save')),
      onError: () => toast.error(t('errors.serverError')),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('wedding.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 max-w-lg">
        <div className="space-y-2">
          <Label>{t('wedding.title')}</Label>
          <Input
            value={form.title}
            onChange={(e) => handleChange('title', e.target.value)}
          />
          {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
        </div>

        <div className="space-y-2">
          <Label>{t('wedding.weddingDate')}</Label>
          <Input
            type="date"
            value={form.date}
            onChange={(e) => handleChange('date', e.target.value)}
          />
          {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
        </div>

        <div className="space-y-2">
          <Label>{t('wedding.estimatedGuests')}</Label>
          <Input
            type="number"
            value={form.estimatedGuests}
            onChange={(e) => handleChange('estimatedGuests', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>{t('wedding.venue')}</Label>
          <Input
            value={form.venue}
            onChange={(e) => handleChange('venue', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>{t('wedding.style')}</Label>
          <div className="flex flex-wrap gap-2">
            {STYLE_OPTIONS.map((style) => (
              <Badge
                key={style}
                variant={form.styles.includes(style) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleStyle(style)}
              >
                {t(`styles.${style}`)}
                {form.styles.includes(style) && <X className="ml-1 h-3 w-3" />}
              </Badge>
            ))}
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? t('common.loading') : t('common.save')}
        </Button>
      </CardContent>
    </Card>
  );
}
