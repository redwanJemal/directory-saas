import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  Tenant,
  CreateTenantInput,
  UpdateTenantInput,
  SuspendTenantInput,
} from '../types';

interface TenantsQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  sort?: string;
}

interface TenantsResponse {
  data: Tenant[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

export function useTenantsQuery(params: TenantsQueryParams = {}) {
  return useQuery({
    queryKey: ['tenants', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.set('page', String(params.page));
      if (params.pageSize) queryParams.set('pageSize', String(params.pageSize));
      if (params.search)
        queryParams.set('filter[name][contains]', params.search);
      if (params.status && params.status !== 'all')
        queryParams.set('filter[status]', params.status);
      if (params.sort) queryParams.set('sort', params.sort);

      const response = await api.get<TenantsResponse>(
        `/admin/tenants?${queryParams}`,
      );
      return response.data;
    },
  });
}

export function useTenantQuery(id: string) {
  return useQuery({
    queryKey: ['tenants', id],
    queryFn: async () => {
      const response = await api.get<{ data: Tenant }>(`/admin/tenants/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateTenantMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTenantInput) => {
      const response = await api.post<{ data: Tenant }>(
        '/admin/tenants',
        input,
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
  });
}

export function useUpdateTenantMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateTenantInput & { id: string }) => {
      const response = await api.patch<{ data: Tenant }>(
        `/admin/tenants/${id}`,
        input,
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
  });
}

export function useSuspendTenantMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: SuspendTenantInput & { id: string }) => {
      const response = await api.patch<{ data: Tenant }>(
        `/admin/tenants/${id}/suspend`,
        input,
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
  });
}
