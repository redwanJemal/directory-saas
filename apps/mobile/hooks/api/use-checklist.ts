import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface ChecklistTask {
  id: string;
  title: string;
  dueDate: string | null;
  category: string;
  isCompleted: boolean;
  completedAt: string | null;
  sortOrder: number;
}

export function useChecklist(filter?: 'all' | 'overdue' | 'upcoming' | 'completed') {
  return useQuery({
    queryKey: ['checklist', filter],
    queryFn: async () => {
      const params = filter && filter !== 'all' ? `?filter[status]=${filter}` : '';
      const response = await api.get(`/wedding/checklist${params}`);
      return response.data as ChecklistTask[];
    },
  });
}

export function useToggleTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isCompleted }: { id: string; isCompleted: boolean }) => {
      const response = await api.patch(`/wedding/checklist/${id}`, { isCompleted });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist'] });
      queryClient.invalidateQueries({ queryKey: ['wedding', 'stats'] });
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { title: string; dueDate?: string; category?: string }) => {
      const response = await api.post('/wedding/checklist', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist'] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/wedding/checklist/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist'] });
    },
  });
}
