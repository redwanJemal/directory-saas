import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Deal } from '../types';
import type { ApiResponse, ApiPagedResponse } from '@/lib/types';

export function useDealsQuery(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['provider-deals', page, pageSize],
    queryFn: async () => {
      const response = await api.get<ApiPagedResponse<Deal>>(
        `/providers/me/deals?page=${page}&pageSize=${pageSize}`,
      );
      return response.data;
    },
  });
}

export function useCreateDealMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Deal, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
      const response = await api.post<ApiResponse<Deal>>('/providers/me/deals', data);
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['provider-deals'] }),
  });
}

export function useUpdateDealMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Deal> & { id: string }) => {
      const response = await api.patch<ApiResponse<Deal>>(`/providers/me/deals/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['provider-deals'] }),
  });
}

export function useDeleteDealMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/providers/me/deals/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['provider-deals'] }),
  });
}
