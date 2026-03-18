import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface DashboardStats {
  totalBusinesses: number;
  pendingVerifications: number;
  newThisWeek: number;
  totalReviews: number;
  verifiedBusinesses: number;
  totalContactClicks: number;
}

interface BusinessOverTimeEntry {
  date: string;
  total: number;
  byCountry: Record<string, number>;
}

interface ContactClicksByType {
  period: string;
  total: number;
  byType: Record<string, number>;
}

export function useDashboardStatsQuery() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get<{ data: DashboardStats }>(
        '/admin/dashboard/stats',
      );
      return response.data.data;
    },
    refetchInterval: 60000,
  });
}

export function useBusinessesOverTimeQuery(days = 30) {
  return useQuery({
    queryKey: ['businesses-over-time', days],
    queryFn: async () => {
      const response = await api.get<{
        data: { period: string; daily: BusinessOverTimeEntry[] };
      }>(`/admin/dashboard/businesses-over-time?days=${days}`);
      return response.data.data;
    },
  });
}

export function useContactClicksByTypeQuery(days = 30) {
  return useQuery({
    queryKey: ['contact-clicks-by-type', days],
    queryFn: async () => {
      const response = await api.get<{ data: ContactClicksByType }>(
        `/admin/dashboard/contact-clicks-by-type?days=${days}`,
      );
      return response.data.data;
    },
  });
}
