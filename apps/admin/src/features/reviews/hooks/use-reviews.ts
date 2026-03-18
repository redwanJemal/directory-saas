import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AdminReview } from '../types';

interface ReviewsQueryParams {
  page?: number;
  pageSize?: number;
  rating?: string;
  isPublic?: string;
  search?: string;
}

interface ReviewsResponse {
  data: AdminReview[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

export function useAdminReviewsQuery(params: ReviewsQueryParams = {}) {
  return useQuery({
    queryKey: ['admin-reviews', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.set('page', String(params.page));
      if (params.pageSize) queryParams.set('pageSize', String(params.pageSize));
      if (params.rating && params.rating !== 'all')
        queryParams.set('rating', params.rating);
      if (params.isPublic && params.isPublic !== 'all')
        queryParams.set('isPublic', params.isPublic);
      if (params.search) queryParams.set('search', params.search);

      const response = await api.get<ReviewsResponse>(
        `/admin/reviews?${queryParams}`,
      );
      return response.data;
    },
  });
}

export function useModerateReviewMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isPublic }: { id: string; isPublic: boolean }) => {
      const response = await api.patch<{ data: AdminReview }>(
        `/admin/reviews/${id}/moderate`,
        { isPublic },
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
    },
  });
}
