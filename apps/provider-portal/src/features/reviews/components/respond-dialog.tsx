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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useRespondToReview } from '../hooks/use-reviews';

interface RespondDialogProps {
  reviewId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RespondDialog({ reviewId, open, onOpenChange }: RespondDialogProps) {
  const { t } = useTranslation();
  const respondMutation = useRespondToReview();
  const [response, setResponse] = useState('');
  const maxChars = 1000;

  async function handleSubmit() {
    if (!reviewId || !response.trim()) return;

    try {
      await respondMutation.mutateAsync({ reviewId, response: response.trim() });
      toast.success(t('reviews.responseSent'));
      onOpenChange(false);
      setResponse('');
    } catch {
      toast.error(t('errors.serverError'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('reviews.respondToReview')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 py-4">
          <Label htmlFor="response">{t('reviews.yourResponse')}</Label>
          <Textarea
            id="response"
            rows={5}
            value={response}
            onChange={(e) => setResponse(e.target.value.slice(0, maxChars))}
            placeholder={t('reviews.responsePlaceholder')}
          />
          <p className="text-xs text-muted-foreground text-right">
            {response.length} / {maxChars}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={respondMutation.isPending || !response.trim()}
          >
            {respondMutation.isPending ? t('common.loading') : t('reviews.respond')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
