import { useTranslation } from 'react-i18next';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/status-badge';
import type { Tenant } from '../types';

interface ViewTenantSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: Tenant | null;
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{children}</span>
    </div>
  );
}

export function ViewTenantSheet({
  open,
  onOpenChange,
  tenant,
}: ViewTenantSheetProps) {
  const { t } = useTranslation();

  if (!tenant) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[480px]">
        <SheetHeader>
          <SheetTitle>{t('tenants.viewTenant')}</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
              {t('tenants.sectionGeneral')}
            </h3>
            <div className="rounded-lg border border-border p-4">
              <InfoRow label={t('tenants.name')}>{tenant.name}</InfoRow>
              <Separator />
              <InfoRow label={t('tenants.slug')}>{tenant.slug}</InfoRow>
              <Separator />
              <InfoRow label={t('common.status')}>
                <StatusBadge status={tenant.status} />
              </InfoRow>
              <Separator />
              <InfoRow label={t('tenants.createdAt')}>
                {new Date(tenant.createdAt).toLocaleDateString()}
              </InfoRow>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
              {t('tenants.sectionSubscription')}
            </h3>
            <div className="rounded-lg border border-border p-4">
              <InfoRow label={t('tenants.plan')}>
                {tenant.plan?.name ?? '—'}
              </InfoRow>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
              {t('tenants.sectionUsers')}
            </h3>
            <div className="rounded-lg border border-border p-4">
              <InfoRow label={t('tenants.usersCount')}>
                {tenant.usersCount ?? 0}
              </InfoRow>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
