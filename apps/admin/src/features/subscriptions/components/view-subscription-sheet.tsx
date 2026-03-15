import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/status-badge';
import type { Subscription } from '../types';

interface ViewSubscriptionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: Subscription | null;
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

export function ViewSubscriptionSheet({
  open,
  onOpenChange,
  subscription,
}: ViewSubscriptionSheetProps) {
  const { t } = useTranslation();

  if (!subscription) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[480px]">
        <SheetHeader>
          <SheetTitle>{t('subscriptions.viewSubscription')}</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
              {t('subscriptions.sectionGeneral')}
            </h3>
            <div className="rounded-lg border border-border p-4">
              <InfoRow label={t('subscriptions.tenantName')}>
                {subscription.tenant?.name ?? '—'}
              </InfoRow>
              <Separator />
              <InfoRow label={t('subscriptions.plan')}>
                {subscription.plan?.name ?? '—'}
              </InfoRow>
              <Separator />
              <InfoRow label={t('common.status')}>
                <StatusBadge status={subscription.status} />
              </InfoRow>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
              {t('subscriptions.sectionDates')}
            </h3>
            <div className="rounded-lg border border-border p-4">
              <InfoRow label={t('subscriptions.startDate')}>
                {format(new Date(subscription.startDate), 'MMM d, yyyy')}
              </InfoRow>
              <Separator />
              <InfoRow label={t('subscriptions.endDate')}>
                {subscription.endDate
                  ? format(new Date(subscription.endDate), 'MMM d, yyyy')
                  : '—'}
              </InfoRow>
              <Separator />
              <InfoRow label={t('subscriptions.createdAt')}>
                {format(new Date(subscription.createdAt), 'MMM d, yyyy')}
              </InfoRow>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
