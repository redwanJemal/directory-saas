import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import type { Role } from '../types';

interface ViewRoleSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role | null;
}

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{children}</span>
    </div>
  );
}

export function ViewRoleSheet({
  open,
  onOpenChange,
  role,
}: ViewRoleSheetProps) {
  const { t } = useTranslation();

  if (!role) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[480px]">
        <SheetHeader>
          <SheetTitle>{t('roles.viewRole')}</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
              {t('roles.sectionGeneral')}
            </h3>
            <div className="rounded-lg border border-border p-4">
              <InfoRow label={t('roles.roleName')}>{role.name}</InfoRow>
              <Separator />
              <InfoRow label={t('roles.description')}>
                {role.description || '—'}
              </InfoRow>
              <Separator />
              <InfoRow label={t('roles.tenantLabel')}>
                {role.tenant?.name ?? t('roles.platform')}
              </InfoRow>
              <Separator />
              <InfoRow label={t('roles.createdAt')}>
                {format(new Date(role.createdAt), 'MMM d, yyyy')}
              </InfoRow>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
              {t('roles.permissions')} ({role.permissions.length})
            </h3>
            <div className="rounded-lg border border-border p-4">
              <div className="flex flex-wrap gap-2">
                {role.permissions.map((perm) => (
                  <Badge key={perm} variant="secondary" className="text-xs">
                    {perm}
                  </Badge>
                ))}
                {role.permissions.length === 0 && (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
