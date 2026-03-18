import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useReviewVerificationMutation } from '../hooks/use-verifications';
import type { VerificationRequest } from '../types';

interface ReviewVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  verification: VerificationRequest | null;
}

export function ReviewVerificationDialog({
  open,
  onOpenChange,
  verification,
}: ReviewVerificationDialogProps) {
  const { t } = useTranslation();
  const [adminNotes, setAdminNotes] = useState('');
  const mutation = useReviewVerificationMutation();

  const handleAction = (status: 'approved' | 'rejected') => {
    if (!verification) return;
    mutation.mutate(
      { id: verification.id, status, adminNotes: adminNotes || undefined },
      {
        onSuccess: () => {
          toast.success(
            status === 'approved'
              ? t('verifications.approved')
              : t('verifications.rejected'),
          );
          setAdminNotes('');
          onOpenChange(false);
        },
      },
    );
  };

  if (!verification) return null;

  const documents = verification.documentUrls || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('verifications.reviewTitle')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-muted-foreground">
              {t('verifications.business')}
            </Label>
            <p className="font-medium">
              {verification.providerProfile?.tenant?.name}
            </p>
          </div>

          <div>
            <Label className="text-muted-foreground">
              {t('verifications.submittedAt')}
            </Label>
            <p>{new Date(verification.createdAt).toLocaleDateString()}</p>
          </div>

          <div>
            <Label className="text-muted-foreground">
              {t('common.status')}
            </Label>
            <div className="mt-1">
              <Badge
                variant={
                  verification.status === 'pending'
                    ? 'secondary'
                    : verification.status === 'approved'
                      ? 'default'
                      : 'destructive'
                }
              >
                {t(`verifications.status_${verification.status}`)}
              </Badge>
            </div>
          </div>

          {verification.tradeLicenseUrl && (
            <div>
              <Label className="text-muted-foreground">
                {t('verifications.tradeLicense')}
              </Label>
              <a
                href={verification.tradeLicenseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline block mt-1"
              >
                {t('verifications.viewDocument')}
              </a>
            </div>
          )}

          {documents.length > 0 && (
            <div>
              <Label className="text-muted-foreground">
                {t('verifications.documents')}
              </Label>
              <ul className="mt-1 space-y-1">
                {documents.map((url: string, i: number) => (
                  <li key={i}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      {t('verifications.document')} {i + 1}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {verification.notes && (
            <div>
              <Label className="text-muted-foreground">
                {t('verifications.applicantNotes')}
              </Label>
              <p className="text-sm">{verification.notes}</p>
            </div>
          )}

          {verification.status === 'pending' && (
            <div>
              <Label htmlFor="adminNotes">
                {t('verifications.adminNotes')}
              </Label>
              <Textarea
                id="adminNotes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={t('verifications.adminNotesPlaceholder')}
                rows={3}
              />
            </div>
          )}
        </div>

        {verification.status === 'pending' && (
          <DialogFooter className="gap-2">
            <Button
              variant="destructive"
              onClick={() => handleAction('rejected')}
              disabled={mutation.isPending}
            >
              {t('verifications.reject')}
            </Button>
            <Button
              onClick={() => handleAction('approved')}
              disabled={mutation.isPending}
            >
              {t('verifications.approve')}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
