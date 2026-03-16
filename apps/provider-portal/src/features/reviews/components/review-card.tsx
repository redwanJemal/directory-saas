import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Star, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Review } from '../types';

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating
              ? 'fill-secondary-foreground text-secondary-foreground'
              : 'text-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  );
}

interface ReviewCardProps {
  review: Review;
  onRespond: (review: Review) => void;
}

export function ReviewCard({ review, onRespond }: ReviewCardProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <StarRating rating={review.rating} />
              <span className="text-sm text-muted-foreground">
                {format(new Date(review.createdAt), 'PPP')}
              </span>
            </div>
            <p className="font-medium">{review.clientName}</p>
          </div>
        </div>

        <p className="text-sm">{review.text}</p>

        {review.photos && review.photos.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {review.photos.map((photo, i) => (
              <img
                key={i}
                src={photo}
                alt=""
                className="h-20 w-20 rounded-md object-cover border border-border"
              />
            ))}
          </div>
        )}

        {review.response ? (
          <div className="ml-4 pl-4 border-l-2 border-border space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              {t('reviews.yourResponse')}
            </p>
            <p className="text-sm">{review.response}</p>
            {review.respondedAt && (
              <p className="text-xs text-muted-foreground">
                {format(new Date(review.respondedAt), 'PPP')}
              </p>
            )}
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRespond(review)}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            {t('reviews.respond')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
