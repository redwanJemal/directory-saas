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
import { Textarea } from '@/components/ui/textarea';
import { createRoleSchema, type CreateRoleFormData } from '../schemas';
import { useCreateRoleMutation } from '../hooks/use-roles';
import { PermissionsGrid } from './permissions-grid';

interface CreateRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateRoleDialog({
  open,
  onOpenChange,
}: CreateRoleDialogProps) {
  const { t } = useTranslation();
  const createMutation = useCreateRoleMutation();

  const [form, setForm] = useState<CreateRoleFormData>({
    name: '',
    description: '',
    permissions: [],
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateRoleFormData, string>>
  >({});

  useEffect(() => {
    if (open) {
      setForm({ name: '', description: '', permissions: [] });
      setErrors({});
    }
  }, [open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = createRoleSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof CreateRoleFormData, string>> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof CreateRoleFormData;
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
        toast.success(t('roles.roleCreated'));
        onOpenChange(false);
      },
      onError: () => {
        toast.error(t('errors.serverError'));
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t('roles.createRole')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role-name">{t('roles.roleName')}</Label>
            <Input
              id="role-name"
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
            <Label htmlFor="role-description">
              {t('roles.description')}
            </Label>
            <Textarea
              id="role-description"
              value={form.description ?? ''}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('roles.assignPermissions')}</Label>
            <PermissionsGrid
              selectedPermissions={form.permissions}
              onPermissionsChange={(permissions) =>
                setForm((prev) => ({ ...prev, permissions }))
              }
            />
            {errors.permissions && (
              <p className="text-sm text-destructive">{errors.permissions}</p>
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
