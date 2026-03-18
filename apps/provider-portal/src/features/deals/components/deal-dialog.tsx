import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/image-upload';
import { Loader2 } from 'lucide-react';
import { createDealSchema, type CreateDealFormData } from '../schemas';
import type { Deal } from '../types';

interface DealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal?: Deal | null;
  onSubmit: (data: CreateDealFormData) => Promise<void>;
  isPending: boolean;
}

const EMPTY_FORM: CreateDealFormData = {
  title: '',
  description: '',
  discountPercent: null,
  originalPrice: null,
  dealPrice: null,
  imageUrl: '',
  startsAt: '',
  expiresAt: '',
};

export function DealDialog({ open, onOpenChange, deal, onSubmit, isPending }: DealDialogProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<CreateDealFormData>(EMPTY_FORM);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (deal) {
      setForm({
        title: deal.title,
        description: deal.description || '',
        discountPercent: deal.discountPercent,
        originalPrice: deal.originalPrice,
        dealPrice: deal.dealPrice,
        imageUrl: deal.imageUrl || '',
        startsAt: deal.startsAt ? deal.startsAt.slice(0, 16) : '',
        expiresAt: deal.expiresAt ? deal.expiresAt.slice(0, 16) : '',
      });
      setImageUrl(deal.imageUrl);
    } else {
      setForm(EMPTY_FORM);
      setImageUrl(null);
    }
    setErrors({});
  }, [deal, open]);

  function updateField<K extends keyof CreateDealFormData>(
    key: K,
    value: CreateDealFormData[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const payload = {
      ...form,
      imageUrl: imageUrl || undefined,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : undefined,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
    };

    const result = createDealSchema.safeParse(payload);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0]?.toString();
        if (key) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    await onSubmit(result.data);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {deal ? t('deals.editDeal') : t('deals.createDeal')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t('deals.dealTitle')}</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('profile.description')}</Label>
            <Textarea
              id="description"
              value={form.description ?? ''}
              onChange={(e) => updateField('description', e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid gap-4 grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="discountPercent">{t('deals.discountPercent')}</Label>
              <Input
                id="discountPercent"
                type="number"
                min={1}
                max={99}
                value={form.discountPercent ?? ''}
                onChange={(e) =>
                  updateField(
                    'discountPercent',
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                placeholder="%"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="originalPrice">{t('deals.originalPrice')}</Label>
              <Input
                id="originalPrice"
                type="number"
                min={0}
                step={0.01}
                value={form.originalPrice ?? ''}
                onChange={(e) =>
                  updateField(
                    'originalPrice',
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dealPrice">{t('deals.dealPrice')}</Label>
              <Input
                id="dealPrice"
                type="number"
                min={0}
                step={0.01}
                value={form.dealPrice ?? ''}
                onChange={(e) =>
                  updateField(
                    'dealPrice',
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
              />
            </div>
          </div>

          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startsAt">{t('deals.startsAt')}</Label>
              <Input
                id="startsAt"
                type="datetime-local"
                value={form.startsAt ?? ''}
                onChange={(e) => updateField('startsAt', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiresAt">{t('deals.expiresAt')}</Label>
              <Input
                id="expiresAt"
                type="datetime-local"
                value={form.expiresAt ?? ''}
                onChange={(e) => updateField('expiresAt', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('deals.image')}</Label>
            <ImageUpload
              currentUrl={imageUrl}
              onUpload={setImageUrl}
              onRemove={() => setImageUrl(null)}
              aspectRatio="wide"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {deal ? t('common.save') : t('common.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
