import { useTranslation } from 'react-i18next';
import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { ReviewSummary } from '../types';

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= Math.round(rating)
              ? 'fill-secondary-foreground text-secondary-foreground'
              : 'text-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  );
}

interface RatingSummaryProps {
  summary: ReviewSummary;
}

export function RatingSummary({ summary }: RatingSummaryProps) {
  const { t } = useTranslation();
  const { average, total, distribution } = summary;

  return (
    <Card>
      <CardContent className="flex gap-6 p-6">
        <div className="text-center">
          <div className="text-4xl font-bold">{average.toFixed(1)}</div>
          <StarRating rating={average} />
          <p className="text-sm text-muted-foreground mt-1">
            {t('reviews.totalReviewsCount', { count: total })}
          </p>
        </div>
        <div className="flex-1 space-y-1">
          {[5, 4, 3, 2, 1].map((stars) => (
            <div key={stars} className="flex items-center gap-2">
              <span className="text-sm w-3">{stars}</span>
              <Star className="h-3 w-3 fill-secondary-foreground text-secondary-foreground" />
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-secondary-foreground rounded-full"
                  style={{
                    width: total > 0 ? `${((distribution[stars] ?? 0) / total) * 100}%` : '0%',
                  }}
                />
              </div>
              <span className="text-sm text-muted-foreground w-8">
                {distribution[stars] ?? 0}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
