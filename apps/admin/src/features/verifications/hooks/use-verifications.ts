import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { VerificationRequest, ReviewVerificationInput } from '../types';

interface VerificationsQueryParams {
  page?: number;
  pageSize?: number;
  status?: string;
}

interface VerificationsResponse {
  data: VerificationRequest[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

export function useVerificationsQuery(params: VerificationsQueryParams = {}) {
  return useQuery({
    queryKey: ['verifications', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.set('page', String(params.page));
      if (params.pageSize) queryParams.set('pageSize', String(params.pageSize));
      if (params.status && params.status !== 'all')
        queryParams.set('status', params.status);

      const response = await api.get<VerificationsResponse>(
        `/admin/verifications?${queryParams}`,
      );
      return response.data;
    },
  });
}

export function useReviewVerificationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: ReviewVerificationInput & { id: string }) => {
      const response = await api.patch<{ data: VerificationRequest }>(
        `/admin/verifications/${id}`,
        input,
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}
