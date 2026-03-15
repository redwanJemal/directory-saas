import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { User } from '../types';

interface UsersQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: string;
  sort?: string;
}

interface UsersResponse {
  data: User[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

export function useUsersQuery(params: UsersQueryParams = {}) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.set('page', String(params.page));
      if (params.pageSize) queryParams.set('pageSize', String(params.pageSize));
      if (params.search)
        queryParams.set('filter[name][contains]', params.search);
      if (params.type && params.type !== 'all')
        queryParams.set('filter[type]', params.type);
      if (params.sort) queryParams.set('sort', params.sort);

      const response = await api.get<UsersResponse>(
        `/admin/users?${queryParams}`,
      );
      return response.data;
    },
  });
}

export function useUserQuery(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: async () => {
      const response = await api.get<{ data: User }>(`/admin/users/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });
}
