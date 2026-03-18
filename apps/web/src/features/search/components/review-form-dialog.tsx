import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSubmitReview } from '../hooks/use-search';

interface ReviewFormDialogProps {
  providerId: string;
  providerName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReviewFormDialog({
  providerId,
  providerName,
  open,
  onOpenChange,
}: ReviewFormDialogProps) {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const submitReview = useSubmitReview(providerId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    try {
      await submitReview.mutateAsync({
        rating,
        title: title || undefined,
        comment: comment || undefined,
      });
      toast.success(t('vendor.reviewSubmitted'));
      onOpenChange(false);
      setRating(0);
      setTitle('');
      setComment('');
    } catch {
      toast.error(t('errors.serverError'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t('vendor.writeReview')} — {providerName}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t('vendor.yourRating')}</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="p-0.5"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={`h-7 w-7 transition-colors ${
                      star <= (hoverRating || rating)
                        ? 'fill-primary text-primary'
                        : 'text-muted-foreground'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reviewTitle">{t('vendor.reviewTitle')}</Label>
            <Input
              id="reviewTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('vendor.reviewTitlePlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reviewComment">{t('vendor.reviewComment')}</Label>
            <Textarea
              id="reviewComment"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('vendor.reviewCommentPlaceholder')}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={rating === 0 || submitReview.isPending}
          >
            {submitReview.isPending ? t('common.loading') : t('vendor.submitReview')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
