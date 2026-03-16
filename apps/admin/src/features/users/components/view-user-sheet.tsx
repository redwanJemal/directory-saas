import { useTranslation } from 'react-i18next';
import { formatDistanceToNow, format } from 'date-fns';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { User } from '../types';

interface ViewUserSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

const typeStyles: Record<string, string> = {
  admin:
    'bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/20 dark:text-destructive',
  tenant:
    'bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary',
  client:
    'bg-accent text-accent-foreground border-accent dark:bg-accent dark:text-accent-foreground',
};

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

export function ViewUserSheet({
  open,
  onOpenChange,
  user,
}: ViewUserSheetProps) {
  const { t } = useTranslation();

  if (!user) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[480px]">
        <SheetHeader>
          <SheetTitle>{t('users.viewUser')}</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
              {t('users.sectionGeneral')}
            </h3>
            <div className="rounded-lg border border-border p-4">
              <InfoRow label={t('users.name')}>{user.name}</InfoRow>
              <Separator />
              <InfoRow label={t('users.email')}>{user.email}</InfoRow>
              <Separator />
              <InfoRow label={t('users.type')}>
                <Badge
                  variant="outline"
                  className={cn(
                    'font-medium capitalize',
                    typeStyles[user.type] ?? '',
                  )}
                >
                  {t(`users.${user.type}`)}
                </Badge>
              </InfoRow>
              <Separator />
              <InfoRow label={t('common.status')}>
                <StatusBadge status={user.status} />
              </InfoRow>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
              {t('users.sectionAssociation')}
            </h3>
            <div className="rounded-lg border border-border p-4">
              <InfoRow label={t('users.tenantName')}>
                {user.tenant?.name ?? '—'}
              </InfoRow>
              <Separator />
              <InfoRow label={t('users.roleName')}>
                {user.role?.name ?? '—'}
              </InfoRow>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
              {t('users.sectionActivity')}
            </h3>
            <div className="rounded-lg border border-border p-4">
              <InfoRow label={t('users.lastLogin')}>
                {user.lastLoginAt
                  ? formatDistanceToNow(new Date(user.lastLoginAt), {
                      addSuffix: true,
                    })
                  : '—'}
              </InfoRow>
              <Separator />
              <InfoRow label={t('users.createdAt')}>
                {format(new Date(user.createdAt), 'MMM d, yyyy')}
              </InfoRow>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
