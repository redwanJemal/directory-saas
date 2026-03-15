import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Subscription, SubscriptionPlan } from '../types';

interface SubscriptionsQueryParams {
  page?: number;
  pageSize?: number;
  status?: string;
  sort?: string;
}

interface SubscriptionsResponse {
  data: Subscription[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

export function useSubscriptionsQuery(params: SubscriptionsQueryParams = {}) {
  return useQuery({
    queryKey: ['subscriptions', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.set('page', String(params.page));
      if (params.pageSize) queryParams.set('pageSize', String(params.pageSize));
      if (params.status && params.status !== 'all')
        queryParams.set('filter[status]', params.status);
      if (params.sort) queryParams.set('sort', params.sort);

      const response = await api.get<SubscriptionsResponse>(
        `/admin/subscriptions?${queryParams}`,
      );
      return response.data;
    },
  });
}

export function useSubscriptionPlansQuery() {
  return useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const response = await api.get<{ data: SubscriptionPlan[] }>(
        '/subscription-plans',
      );
      return response.data.data;
    },
  });
}

export function useChangePlanMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      subscriptionId,
      planId,
    }: {
      subscriptionId: string;
      planId: string;
    }) => {
      const response = await api.patch<{ data: Subscription }>(
        `/admin/subscriptions/${subscriptionId}`,
        { planId },
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });
}
