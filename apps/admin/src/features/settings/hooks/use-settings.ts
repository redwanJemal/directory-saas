import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface HealthStatus {
  status: string;
  info?: Record<string, { status: string }>;
  error?: Record<string, { status: string; message?: string }>;
  details?: Record<string, { status: string; message?: string }>;
}

export function useHealthQuery() {
  return useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const response = await api.get<HealthStatus>('/health/ready');
      return response.data;
    },
    refetchInterval: 30_000,
  });
}

export function useHealthLiveQuery() {
  return useQuery({
    queryKey: ['health-live'],
    queryFn: async () => {
      const response = await api.get<HealthStatus>('/health/live');
      return response.data;
    },
    refetchInterval: 30_000,
  });
}
