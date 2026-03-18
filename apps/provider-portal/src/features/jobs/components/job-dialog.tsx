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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { createJobSchema, type CreateJobFormData } from '../schemas';
import type { JobPosting } from '../types';

interface JobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job?: JobPosting | null;
  onSubmit: (data: CreateJobFormData) => Promise<void>;
  isPending: boolean;
}

const EMPTY_FORM: CreateJobFormData = {
  title: '',
  description: '',
  type: 'full-time',
  salaryMin: null,
  salaryMax: null,
  salaryCurrency: 'AED',
  city: '',
  country: '',
  expiresAt: '',
};

export function JobDialog({ open, onOpenChange, job, onSubmit, isPending }: JobDialogProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<CreateJobFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (job) {
      setForm({
        title: job.title,
        description: job.description || '',
        type: job.type,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        salaryCurrency: job.salaryCurrency,
        city: job.city || '',
        country: job.country || '',
        expiresAt: job.expiresAt ? job.expiresAt.slice(0, 10) : '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
  }, [job, open]);

  function updateField<K extends keyof CreateJobFormData>(
    key: K,
    value: CreateJobFormData[K],
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

    const result = createJobSchema.safeParse(form);
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
            {job ? t('jobs.editJob') : t('jobs.createJob')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t('jobs.jobTitle')}</Label>
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
              rows={4}
            />
          </div>

          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">{t('jobs.jobType')}</Label>
              <Select
                value={form.type}
                onValueChange={(v) => updateField('type', v as 'full-time' | 'part-time' | 'freelance')}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">{t('jobs.type_full-time')}</SelectItem>
                  <SelectItem value="part-time">{t('jobs.type_part-time')}</SelectItem>
                  <SelectItem value="freelance">{t('jobs.type_freelance')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="salaryCurrency">{t('jobs.currency')}</Label>
              <Select
                value={form.salaryCurrency}
                onValueChange={(v) => updateField('salaryCurrency', v)}
              >
                <SelectTrigger id="salaryCurrency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AED">AED</SelectItem>
                  <SelectItem value="SAR">SAR</SelectItem>
                  <SelectItem value="KWD">KWD</SelectItem>
                  <SelectItem value="QAR">QAR</SelectItem>
                  <SelectItem value="BHD">BHD</SelectItem>
                  <SelectItem value="OMR">OMR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="salaryMin">{t('jobs.salaryMin')}</Label>
              <Input
                id="salaryMin"
                type="number"
                min={0}
                value={form.salaryMin ?? ''}
                onChange={(e) =>
                  updateField('salaryMin', e.target.value ? Number(e.target.value) : null)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salaryMax">{t('jobs.salaryMax')}</Label>
              <Input
                id="salaryMax"
                type="number"
                min={0}
                value={form.salaryMax ?? ''}
                onChange={(e) =>
                  updateField('salaryMax', e.target.value ? Number(e.target.value) : null)
                }
              />
            </div>
          </div>

          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">{t('profile.city')}</Label>
              <Input
                id="city"
                value={form.city ?? ''}
                onChange={(e) => updateField('city', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">{t('profile.country')}</Label>
              <Input
                id="country"
                value={form.country ?? ''}
                onChange={(e) => updateField('country', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiresAt">{t('jobs.expiresAt')}</Label>
            <Input
              id="expiresAt"
              type="date"
              value={form.expiresAt ?? ''}
              onChange={(e) => updateField('expiresAt', e.target.value)}
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
              {job ? t('common.save') : t('common.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
