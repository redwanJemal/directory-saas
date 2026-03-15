import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createTenantSchema, type CreateTenantFormData } from '../schemas';
import { useCreateTenantMutation } from '../hooks/use-tenants';

interface CreateTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function CreateTenantDialog({
  open,
  onOpenChange,
}: CreateTenantDialogProps) {
  const { t } = useTranslation();
  const createMutation = useCreateTenantMutation();

  const [form, setForm] = useState<CreateTenantFormData>({
    name: '',
    slug: '',
    ownerEmail: '',
  });
  const [autoSlug, setAutoSlug] = useState(true);
  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateTenantFormData, string>>
  >({});

  useEffect(() => {
    if (open) {
      setForm({ name: '', slug: '', ownerEmail: '' });
      setAutoSlug(true);
      setErrors({});
    }
  }, [open]);

  useEffect(() => {
    if (autoSlug) {
      setForm((prev) => ({ ...prev, slug: slugify(prev.name) }));
    }
  }, [form.name, autoSlug]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = createTenantSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof CreateTenantFormData, string>> =
        {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof CreateTenantFormData;
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    createMutation.mutate(result.data, {
      onSuccess: () => {
        toast.success(t('tenants.tenantCreated'));
        onOpenChange(false);
      },
      onError: () => {
        toast.error(t('errors.serverError'));
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('tenants.createTenant')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('tenants.name')}</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">{t('tenants.slug')}</Label>
            <Input
              id="slug"
              value={form.slug}
              onChange={(e) => {
                setAutoSlug(false);
                setForm((prev) => ({ ...prev, slug: e.target.value }));
              }}
            />
            {errors.slug && (
              <p className="text-sm text-destructive">{errors.slug}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="ownerEmail">{t('tenants.ownerEmail')}</Label>
            <Input
              id="ownerEmail"
              type="email"
              value={form.ownerEmail}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, ownerEmail: e.target.value }))
              }
            />
            {errors.ownerEmail && (
              <p className="text-sm text-destructive">{errors.ownerEmail}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending
                ? t('common.loading')
                : t('common.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
