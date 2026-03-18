import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface ChartDataPoint {
  date: string;
  value: number;
}

export interface AdminMetrics {
  stats: {
    totalBusinesses: number;
    newBusinesses: number;
    newBusinessesTrend: number;
    totalClients: number;
    newClients: number;
    newClientsTrend: number;
    totalReviews: number;
    verifiedBusinesses: number;
    pendingVerifications: number;
    contactClicks: number;
    verificationRate: number;
  };
  userGrowthChart: ChartDataPoint[];
  businessGrowthChart: ChartDataPoint[];
  businessesByCountry: Record<string, number>;
  topCategories: { name: string; count: number }[];
  topBusinessesByClicks: { name: string; clicks: number }[];
}

export function useAdminAnalytics(days: number = 30) {
  return useQuery({
    queryKey: ['admin-analytics', days],
    queryFn: async () => {
      const { data } = await api.get<{ data: AdminMetrics }>(
        `/admin/analytics/platform?days=${days}`,
      );
      return data.data;
    },
    refetchInterval: 60000,
  });
}
