import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useReviews, useReviewSummary } from './hooks/use-reviews';
import { RatingSummary } from './components/rating-summary';
import { ReviewCard } from './components/review-card';
import { RespondDialog } from './components/respond-dialog';
import type { Review } from './types';

const RATING_FILTERS = [null, 5, 4, 3, 2, 1] as const;

export function ReviewsPage() {
  const { t } = useTranslation();
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [respondReviewId, setRespondReviewId] = useState<string | null>(null);
  const [respondOpen, setRespondOpen] = useState(false);

  const { data: summary, isLoading: summaryLoading } = useReviewSummary();
  const { data: reviewsData, isLoading: reviewsLoading } = useReviews({
    page,
    pageSize: 20,
    rating: ratingFilter,
  });

  function handleRespond(review: Review) {
    setRespondReviewId(review.id);
    setRespondOpen(true);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('reviews.title')}</h1>
      </div>

      {summaryLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : summary ? (
        <RatingSummary summary={summary} />
      ) : null}

      <div className="flex items-center gap-2 flex-wrap">
        {RATING_FILTERS.map((rating) => (
          <Button
            key={rating ?? 'all'}
            variant={ratingFilter === rating ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setRatingFilter(rating); setPage(1); }}
          >
            {rating === null
              ? t('bookings.all')
              : t('reviews.starsFilter', { count: rating })}
          </Button>
        ))}
      </div>

      {reviewsLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : reviewsData?.data?.length ? (
        <div className="space-y-4">
          {reviewsData.data.map((review) => (
            <ReviewCard key={review.id} review={review} onRespond={handleRespond} />
          ))}

          {reviewsData.pagination && reviewsData.pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                {t('common.back')}
              </Button>
              <span className="text-sm text-muted-foreground">
                {page} / {reviewsData.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= reviewsData.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                {t('common.next')}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="py-12 text-center text-muted-foreground">
          {t('reviews.noReviews')}
        </div>
      )}

      <RespondDialog
        reviewId={respondReviewId}
        open={respondOpen}
        onOpenChange={setRespondOpen}
      />
    </div>
  );
}
