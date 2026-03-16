import { useState } from 'react';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useChangeRole, useTenantRoles } from '../hooks/use-team';
import type { TeamMember } from '../types';

interface ChangeRoleDialogProps {
  member: TeamMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangeRoleDialog({ member, open, onOpenChange }: ChangeRoleDialogProps) {
  const { t } = useTranslation();
  const changeRole = useChangeRole();
  const { data: roles } = useTenantRoles();
  const [roleId, setRoleId] = useState('');

  async function handleSubmit() {
    if (!member || !roleId) return;

    try {
      await changeRole.mutateAsync({ userId: member.id, dto: { roleId } });
      toast.success(t('team.roleChanged'));
      onOpenChange(false);
      setRoleId('');
    } catch {
      toast.error(t('errors.serverError'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('team.changeRole')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            {t('team.changeRoleDescription', { name: member?.name })}
          </p>

          <div className="space-y-2">
            <Label>{t('team.role')}</Label>
            <Select value={roleId} onValueChange={setRoleId}>
              <SelectTrigger>
                <SelectValue placeholder={t('team.selectRole')} />
              </SelectTrigger>
              <SelectContent>
                {roles?.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={changeRole.isPending || !roleId}>
            {changeRole.isPending ? t('common.loading') : t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
