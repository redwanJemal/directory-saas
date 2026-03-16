import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ApiPagedResponse, ApiResponse } from '@/lib/types';
import type { ChecklistTask } from '../types';
import type { CreateTaskDto } from '../schemas';

interface UseChecklistParams {
  filter?: 'all' | 'overdue' | 'upcoming' | 'completed';
}

export function useChecklist(params: UseChecklistParams = {}) {
  return useQuery({
    queryKey: ['checklist', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.set('pageSize', '100');
      searchParams.set('sort', 'dueDate');

      if (params.filter === 'completed') {
        searchParams.set('filter[completed]', 'true');
      } else if (params.filter === 'overdue' || params.filter === 'upcoming') {
        searchParams.set('filter[completed]', 'false');
      }

      const { data } = await api.get<ApiPagedResponse<ChecklistTask>>(
        `/weddings/me/checklist?${searchParams.toString()}`,
      );
      return data.data;
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateTaskDto) => {
      const { data } = await api.post<ApiResponse<ChecklistTask>>('/weddings/me/checklist', dto);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist'] });
    },
  });
}

export function useToggleTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, completed }: { taskId: string; completed: boolean }) => {
      const { data } = await api.patch<ApiResponse<ChecklistTask>>(
        `/weddings/me/checklist/${taskId}`,
        { completed },
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist'] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      await api.delete(`/weddings/me/checklist/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist'] });
    },
  });
}
