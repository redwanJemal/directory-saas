import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CommunityEvent } from '../types';
import type { ApiResponse, ApiPagedResponse } from '@/lib/types';

export function useEventsQuery(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['provider-events', page, pageSize],
    queryFn: async () => {
      const response = await api.get<ApiPagedResponse<CommunityEvent>>(
        `/providers/me/events?page=${page}&pageSize=${pageSize}`,
      );
      return response.data;
    },
  });
}

export function useCreateEventMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await api.post<ApiResponse<CommunityEvent>>('/providers/me/events', data);
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['provider-events'] }),
  });
}

export function useUpdateEventMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<CommunityEvent> & { id: string }) => {
      const response = await api.patch<ApiResponse<CommunityEvent>>(`/providers/me/events/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['provider-events'] }),
  });
}

export function useDeleteEventMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/providers/me/events/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['provider-events'] }),
  });
}
