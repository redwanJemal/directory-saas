import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { AuditLog } from '../types';

interface ViewAuditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  auditLog: AuditLog | null;
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

export function ViewAuditDialog({
  open,
  onOpenChange,
  auditLog,
}: ViewAuditDialogProps) {
  const { t } = useTranslation();

  if (!auditLog) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t('audit.viewEntry')}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6 pr-4">
            <div>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                {t('audit.sectionGeneral')}
              </h3>
              <div className="rounded-lg border border-border p-4">
                <InfoRow label={t('audit.timestamp')}>
                  {format(
                    new Date(auditLog.createdAt),
                    'MMM d, yyyy HH:mm:ss',
                  )}
                </InfoRow>
                <Separator />
                <InfoRow label={t('audit.user')}>
                  {auditLog.user
                    ? `${auditLog.user.name} (${auditLog.user.email})`
                    : '—'}
                </InfoRow>
                <Separator />
                <InfoRow label={t('audit.action')}>{auditLog.action}</InfoRow>
                <Separator />
                <InfoRow label={t('audit.resource')}>
                  {auditLog.resource}
                </InfoRow>
                <Separator />
                <InfoRow label={t('audit.resourceId')}>
                  {auditLog.resourceId ?? '—'}
                </InfoRow>
              </div>
            </div>

            {auditLog.details && Object.keys(auditLog.details).length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                  {t('audit.details')}
                </h3>
                <pre className="rounded-lg border border-border bg-muted/50 p-4 text-xs overflow-x-auto">
                  {JSON.stringify(auditLog.details, null, 2)}
                </pre>
              </div>
            )}

            {auditLog.before && Object.keys(auditLog.before).length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                  {t('audit.before')}
                </h3>
                <pre className="rounded-lg border border-border bg-muted/50 p-4 text-xs overflow-x-auto">
                  {JSON.stringify(auditLog.before, null, 2)}
                </pre>
              </div>
            )}

            {auditLog.after && Object.keys(auditLog.after).length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                  {t('audit.after')}
                </h3>
                <pre className="rounded-lg border border-border bg-muted/50 p-4 text-xs overflow-x-auto">
                  {JSON.stringify(auditLog.after, null, 2)}
                </pre>
              </div>
            )}

            {(auditLog.ipAddress || auditLog.userAgent) && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                  {t('audit.sectionMetadata')}
                </h3>
                <div className="rounded-lg border border-border p-4">
                  {auditLog.ipAddress && (
                    <>
                      <InfoRow label={t('audit.ipAddress')}>
                        {auditLog.ipAddress}
                      </InfoRow>
                      {auditLog.userAgent && <Separator />}
                    </>
                  )}
                  {auditLog.userAgent && (
                    <div className="py-2">
                      <span className="text-sm text-muted-foreground">
                        {t('audit.userAgent')}
                      </span>
                      <p className="mt-1 text-xs break-all text-muted-foreground">
                        {auditLog.userAgent}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
