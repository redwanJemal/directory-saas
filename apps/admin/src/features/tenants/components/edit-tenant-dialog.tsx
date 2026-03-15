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
import { updateTenantSchema, type UpdateTenantFormData } from '../schemas';
import { useUpdateTenantMutation } from '../hooks/use-tenants';
import type { Tenant } from '../types';

interface EditTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: Tenant | null;
}

export function EditTenantDialog({
  open,
  onOpenChange,
  tenant,
}: EditTenantDialogProps) {
  const { t } = useTranslation();
  const updateMutation = useUpdateTenantMutation();

  const [form, setForm] = useState<UpdateTenantFormData>({ name: '' });
  const [errors, setErrors] = useState<
    Partial<Record<keyof UpdateTenantFormData, string>>
  >({});

  useEffect(() => {
    if (open && tenant) {
      setForm({ name: tenant.name });
      setErrors({});
    }
  }, [open, tenant]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tenant) return;

    const result = updateTenantSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof UpdateTenantFormData, string>> =
        {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof UpdateTenantFormData;
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    updateMutation.mutate(
      { id: tenant.id, ...result.data },
      {
        onSuccess: () => {
          toast.success(t('tenants.tenantUpdated'));
          onOpenChange(false);
        },
        onError: () => {
          toast.error(t('errors.serverError'));
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('tenants.editTenant')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">{t('tenants.name')}</Label>
            <Input
              id="edit-name"
              value={form.name ?? ''}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
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
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending
                ? t('common.loading')
                : t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
