import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AuditLog } from '../types';

interface AuditLogsQueryParams {
  page?: number;
  pageSize?: number;
  action?: string;
  resource?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: string;
}

interface AuditLogsResponse {
  data: AuditLog[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

export function useAuditLogsQuery(
  params: AuditLogsQueryParams = {},
  refetchInterval?: number | false,
) {
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.set('page', String(params.page));
      if (params.pageSize) queryParams.set('pageSize', String(params.pageSize));
      if (params.action && params.action !== 'all')
        queryParams.set('filter[action]', params.action);
      if (params.resource && params.resource !== 'all')
        queryParams.set('filter[resource]', params.resource);
      if (params.dateFrom)
        queryParams.set('filter[createdAt][gte]', params.dateFrom);
      if (params.dateTo)
        queryParams.set('filter[createdAt][lte]', params.dateTo);
      if (params.sort) queryParams.set('sort', params.sort);

      const response = await api.get<AuditLogsResponse>(
        `/admin/audit-logs?${queryParams}`,
      );
      return response.data;
    },
    refetchInterval,
  });
}
