import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Role, CreateRoleInput, UpdateRoleInput } from '../types';

interface RolesQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: string;
}

interface RolesResponse {
  data: Role[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

export function useRolesQuery(params: RolesQueryParams = {}) {
  return useQuery({
    queryKey: ['roles', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.set('page', String(params.page));
      if (params.pageSize) queryParams.set('pageSize', String(params.pageSize));
      if (params.search)
        queryParams.set('filter[name][contains]', params.search);
      if (params.sort) queryParams.set('sort', params.sort);

      const response = await api.get<RolesResponse>(`/roles?${queryParams}`);
      return response.data;
    },
  });
}

export function useCreateRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateRoleInput) => {
      const response = await api.post<{ data: Role }>('/roles', input);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}

export function useUpdateRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateRoleInput & { id: string }) => {
      const response = await api.patch<{ data: Role }>(`/roles/${id}`, input);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}

export function useDeleteRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/roles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}
