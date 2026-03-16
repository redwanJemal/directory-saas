import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ApiResponse, ApiPagedResponse } from '@/lib/types';
import type { Review, ReviewSummary } from '../types';

export function useReviews(params: {
  page?: number;
  pageSize?: number;
  rating?: number | null;
}) {
  const { page = 1, pageSize = 20, rating } = params;

  return useQuery({
    queryKey: ['reviews', { page, pageSize, rating }],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.set('page', String(page));
      searchParams.set('pageSize', String(pageSize));
      if (rating) {
        searchParams.set('filter[rating]', String(rating));
      }
      searchParams.set('sort', '-createdAt');
      const { data } = await api.get<ApiPagedResponse<Review>>(
        `/reviews?${searchParams.toString()}`,
      );
      return data;
    },
  });
}

export function useReviewSummary() {
  return useQuery({
    queryKey: ['reviews', 'summary'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ReviewSummary>>('/reviews/summary');
      return data.data;
    },
  });
}

export function useRespondToReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reviewId, response }: { reviewId: string; response: string }) => {
      const { data } = await api.post<ApiResponse<Review>>(
        `/reviews/${reviewId}/response`,
        { response },
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
}
