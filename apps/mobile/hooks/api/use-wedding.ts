import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Wedding {
  id: string;
  weddingDate: string;
  partnerName: string;
  estimatedGuests: number;
  venue: string | null;
  stylePreferences: string[];
  budget: number | null;
  createdAt: string;
}

export interface WeddingStats {
  daysUntilWedding: number;
  vendorsBooked: number;
  guestsConfirmed: number;
  budgetSpentPercent: number;
  tasksDonePercent: number;
  totalTasks: number;
  completedTasks: number;
}

export interface CreateWeddingData {
  weddingDate: string;
  partnerName: string;
  estimatedGuests: number;
  venue?: string;
  stylePreferences?: string[];
}

export function useWedding() {
  return useQuery({
    queryKey: ['wedding'],
    queryFn: async () => {
      const response = await api.get('/wedding');
      return response.data as Wedding;
    },
    retry: false,
  });
}

export function useWeddingStats() {
  return useQuery({
    queryKey: ['wedding', 'stats'],
    queryFn: async () => {
      const response = await api.get('/wedding/stats');
      return response.data as WeddingStats;
    },
  });
}

export function useCreateWedding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateWeddingData) => {
      const response = await api.post('/wedding', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wedding'] });
    },
  });
}
