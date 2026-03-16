import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ApiResponse } from '@/lib/types';
import type { BudgetSummaryData } from '../types';
import type { CreateBudgetItemDto, UpdateBudgetDto } from '../schemas';

export function useBudget() {
  return useQuery({
    queryKey: ['budget'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<BudgetSummaryData>>('/weddings/me/budget');
      return data.data;
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: UpdateBudgetDto) => {
      const { data } = await api.patch<ApiResponse<BudgetSummaryData>>('/weddings/me/budget', dto);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget'] });
    },
  });
}

export function useAddBudgetItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateBudgetItemDto) => {
      const { data } = await api.post<ApiResponse<unknown>>('/weddings/me/budget/items', dto);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget'] });
    },
  });
}

export function useDeleteBudgetItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      await api.delete(`/weddings/me/budget/items/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget'] });
    },
  });
}
