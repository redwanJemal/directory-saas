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
import { updateRoleSchema, type UpdateRoleFormData } from '../schemas';
import { useUpdateRoleMutation } from '../hooks/use-roles';
import { PermissionsGrid } from './permissions-grid';
import type { Role } from '../types';

interface EditRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role | null;
}

export function EditRoleDialog({
  open,
  onOpenChange,
  role,
}: EditRoleDialogProps) {
  const { t } = useTranslation();
  const updateMutation = useUpdateRoleMutation();

  const [form, setForm] = useState<UpdateRoleFormData>({
    name: '',
    description: '',
    permissions: [],
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof UpdateRoleFormData, string>>
  >({});

  useEffect(() => {
    if (open && role) {
      setForm({
        name: role.name,
        description: role.description ?? '',
        permissions: role.permissions,
      });
      setErrors({});
    }
  }, [open, role]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role) return;
    const result = updateRoleSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof UpdateRoleFormData, string>> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof UpdateRoleFormData;
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    updateMutation.mutate(
      { id: role.id, ...result.data },
      {
        onSuccess: () => {
          toast.success(t('roles.roleUpdated'));
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t('roles.editRole')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-role-name">{t('roles.roleName')}</Label>
            <Input
              id="edit-role-name"
              value={form.name ?? ''}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-role-description">
              {t('roles.description')}
            </Label>
            <Textarea
              id="edit-role-description"
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
              selectedPermissions={form.permissions ?? []}
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
