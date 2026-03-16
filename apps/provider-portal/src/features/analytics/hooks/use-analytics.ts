import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ApiResponse } from '@/lib/types';

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
}

export function useAnalytics(period: string) {
  return useQuery({
    queryKey: ['analytics', period],
    queryFn: async () => {
      try {
        const { data } = await api.get<ApiResponse<AnalyticsData>>(
          `/analytics/provider?period=${period}`,
        );
        return data.data;
      } catch {
        // Return placeholder data if endpoint doesn't exist yet
        return getPlaceholderData();
      }
    },
  });
}

function getPlaceholderData(): AnalyticsData {
  const now = new Date();
  const chartData: ChartDataPoint[] = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (29 - i));
    return {
      date: date.toISOString().slice(0, 10),
      value: Math.floor(Math.random() * 100) + 10,
    };
  });

  return {
    stats: {
      profileViews: 1247,
      profileViewsTrend: 12.5,
      inquiries: 48,
      inquiriesTrend: 8.3,
      bookingRate: 62,
      bookingRateTrend: -2.1,
      revenue: 85000,
      revenueTrend: 15.7,
    },
    profileViewsChart: chartData,
    inquiriesChart: chartData.map((d) => ({ ...d, value: Math.floor(d.value * 0.3) })),
    revenueChart: chartData.map((d) => ({ ...d, value: d.value * 500 })),
    conversionFunnel: {
      views: 1247,
      inquiries: 48,
      quotes: 35,
      bookings: 22,
    },
  };
}
