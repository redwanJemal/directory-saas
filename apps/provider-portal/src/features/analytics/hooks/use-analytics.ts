import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface AnalyticsStats {
  profileViews: number;
  profileViewsTrend: number;
  inquiries: number;
  inquiriesTrend: number;
  bookingRate: number;
  bookingRateTrend: number;
  revenue: number;
  revenueTrend: number;
}

export interface ChartDataPoint {
  date: string;
  value: number;
}

export interface AnalyticsData {
  stats: AnalyticsStats;
  profileViewsChart: ChartDataPoint[];
  inquiriesChart: ChartDataPoint[];
  revenueChart: ChartDataPoint[];
  conversionFunnel: {
    views: number;
    inquiries: number;
    quotes: number;
    bookings: number;
  };
  reviewStats?: {
    averageRating: number;
    totalReviews: number;
    responseRate: number;
    ratingTrend: number;
  };
  contactClicksByType?: Record<string, number>;
}

export function useAnalytics(period: string) {
  return useQuery({
    queryKey: ['analytics', period],
    queryFn: async () => {
      const { data } = await api.get<{ data: AnalyticsData }>(
        `/analytics/provider?period=${period}`,
      );
      return data.data;
    },
    refetchInterval: 60000,
  });
}
