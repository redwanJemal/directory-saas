import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { PortfolioItem } from '@/features/profile/types';

export function usePortfolioQuery() {
  return useQuery({
    queryKey: ['provider-portfolio'],
    queryFn: async () => {
      const response = await api.get<{ data: PortfolioItem[] }>('/providers/me/portfolio');
      return response.data.data;
    },
  });
}

export function useCreatePortfolioItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<PortfolioItem, 'id' | 'sortOrder'>) => {
      const response = await api.post<{ data: PortfolioItem }>('/providers/me/portfolio', data);
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['provider-portfolio'] }),
  });
}

export function useUpdatePortfolioItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<PortfolioItem> & { id: string }) => {
      const response = await api.patch<{ data: PortfolioItem }>(`/providers/me/portfolio/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['provider-portfolio'] }),
  });
}

export function useDeletePortfolioItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/providers/me/portfolio/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['provider-portfolio'] }),
  });
}

export function useReorderPortfolioMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      await api.patch('/providers/me/portfolio/reorder', { ids: orderedIds });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['provider-portfolio'] }),
  });
}
