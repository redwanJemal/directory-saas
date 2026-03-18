import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { JobPosting, JobApplication } from '../types';
import type { ApiResponse, ApiPagedResponse } from '@/lib/types';

export function useJobsQuery(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['provider-jobs', page, pageSize],
    queryFn: async () => {
      const response = await api.get<ApiPagedResponse<JobPosting>>(
        `/providers/me/jobs?page=${page}&pageSize=${pageSize}`,
      );
      return response.data;
    },
  });
}

export function useCreateJobMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await api.post<ApiResponse<JobPosting>>('/providers/me/jobs', data);
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['provider-jobs'] }),
  });
}

export function useUpdateJobMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<JobPosting> & { id: string }) => {
      const response = await api.patch<ApiResponse<JobPosting>>(`/providers/me/jobs/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['provider-jobs'] }),
  });
}

export function useDeleteJobMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/providers/me/jobs/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['provider-jobs'] }),
  });
}

export function useJobApplicationsQuery(jobId: string | null, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['job-applications', jobId, page, pageSize],
    queryFn: async () => {
      const response = await api.get<ApiPagedResponse<JobApplication>>(
        `/providers/me/jobs/${jobId}/applications?page=${page}&pageSize=${pageSize}`,
      );
      return response.data;
    },
    enabled: !!jobId,
  });
}
