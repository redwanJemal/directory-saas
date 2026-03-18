import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface RevenuePayment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  description?: string;
  paidAt?: string;
  createdAt: string;
  tenant?: { id: string; name: string };
  plan?: { id: string; displayName: string };
}

interface RevenueStats {
  totalRevenue: number;
  monthlyRevenue: number;
  activeSubscriptions: number;
  subscriptionsByPlan: Array<{
    planId: string;
    planName: string;
    count: number;
  }>;
  recentPayments: RevenuePayment[];
}

export function useRevenueStatsQuery() {
  return useQuery({
    queryKey: ['admin-revenue'],
    queryFn: async () => {
      const response = await api.get<{ data: RevenueStats }>(
        '/admin/payments/revenue',
      );
      return response.data.data;
    },
  });
}

export type { RevenueStats, RevenuePayment };
