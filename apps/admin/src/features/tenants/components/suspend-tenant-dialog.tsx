import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';
import { suspendTenantSchema, type SuspendTenantFormData } from '../schemas';
import { useSuspendTenantMutation } from '../hooks/use-tenants';
import type { Tenant } from '../types';

interface SuspendTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: Tenant | null;
}

export function SuspendTenantDialog({
  open,
  onOpenChange,
  tenant,
}: SuspendTenantDialogProps) {
  const { t } = useTranslation();
  const suspendMutation = useSuspendTenantMutation();

  const [form, setForm] = useState<SuspendTenantFormData>({ reason: '' });
  const [errors, setErrors] = useState<
    Partial<Record<keyof SuspendTenantFormData, string>>
  >({});

  useEffect(() => {
    if (open) {
      setForm({ reason: '' });
      setErrors({});
    }
  }, [open]);

  function handleSubmit() {
    if (!tenant) return;

    const result = suspendTenantSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof SuspendTenantFormData, string>> =
        {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof SuspendTenantFormData;
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    suspendMutation.mutate(
      { id: tenant.id, ...result.data },
      {
        onSuccess: () => {
          toast.success(t('tenants.tenantSuspended'));
          onOpenChange(false);
        },
        onError: () => {
          toast.error(t('errors.serverError'));
        },
      },
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertDialogTitle>{t('tenants.suspendTenant')}</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            {t('tenants.confirmSuspend')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor="suspend-reason">{t('tenants.suspendReason')}</Label>
          <Textarea
            id="suspend-reason"
            value={form.reason}
            onChange={(e) => setForm({ reason: e.target.value })}
            rows={3}
          />
          {errors.reason && (
            <p className="text-sm text-destructive">{errors.reason}</p>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={suspendMutation.isPending}
          >
            {suspendMutation.isPending
              ? t('common.loading')
              : t('tenants.suspendTenant')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
