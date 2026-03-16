import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface BudgetItem {
  id: string;
  categoryId: string;
  description: string;
  amount: number;
  isPaid: boolean;
  paidDate: string | null;
  vendorName: string | null;
}

export interface BudgetCategory {
  id: string;
  name: string;
  estimatedAmount: number;
  spentAmount: number;
  items: BudgetItem[];
}

export interface BudgetOverview {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  categories: BudgetCategory[];
}

export function useBudgetOverview() {
  return useQuery({
    queryKey: ['budget', 'overview'],
    queryFn: async () => {
      const response = await api.get('/wedding/budget');
      return response.data as BudgetOverview;
    },
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      categoryId: string;
      description: string;
      amount: number;
      vendorName?: string;
    }) => {
      const response = await api.post('/wedding/budget/expenses', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget'] });
      queryClient.invalidateQueries({ queryKey: ['wedding', 'stats'] });
    },
  });
}
