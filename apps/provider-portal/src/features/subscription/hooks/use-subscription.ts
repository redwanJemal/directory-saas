import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useTenantStore } from '@/stores/tenant-store';

interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  priceMonthly: number;
  priceYearly: number;
  maxUsers: number;
  maxStorage: number;
  features: string[];
  sortOrder: number;
}

interface TenantSubscription {
  id: string;
  tenantId: string;
  planId: string;
  status: string;
  startedAt: string;
  renewsAt?: string;
  cancelledAt?: string;
  billingInterval?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  plan: SubscriptionPlan;
}

interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  status: string;
  description?: string;
  paidAt?: string;
  createdAt: string;
}

interface PaymentHistoryResponse {
  data: PaymentRecord[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

export function usePlansQuery() {
  return useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const response = await api.get<{ data: SubscriptionPlan[] }>(
        '/subscription-plans',
      );
      return response.data.data;
    },
  });
}

export function useCurrentSubscriptionQuery() {
  const tenantId = useTenantStore((s) => s.tenantId);
  return useQuery({
    queryKey: ['subscription', tenantId],
    queryFn: async () => {
      const response = await api.get<{ data: TenantSubscription }>(
        `/tenants/${tenantId}/subscription`,
      );
      return response.data.data;
    },
    enabled: !!tenantId,
  });
}

export function usePaymentHistoryQuery(page = 1, pageSize = 10) {
  return useQuery({
    queryKey: ['payment-history', page, pageSize],
    queryFn: async () => {
      const response = await api.get<PaymentHistoryResponse>(
        `/payments/history?page=${page}&pageSize=${pageSize}`,
      );
      return response.data;
    },
  });
}

export function useCheckoutMutation() {
  return useMutation({
    mutationFn: async (params: {
      planId: string;
      interval: 'monthly' | 'yearly';
    }) => {
      const response = await api.post<{
        data: { sessionId: string; url: string };
      }>('/payments/checkout', {
        planId: params.planId,
        interval: params.interval,
        successUrl: `${window.location.origin}/subscription?success=true`,
        cancelUrl: `${window.location.origin}/subscription?cancelled=true`,
      });
      return response.data.data;
    },
  });
}

export function useBillingPortalMutation() {
  return useMutation({
    mutationFn: async () => {
      const response = await api.post<{ data: { url: string } }>(
        '/payments/billing-portal',
        { returnUrl: `${window.location.origin}/subscription` },
      );
      return response.data.data;
    },
  });
}

export type {
  SubscriptionPlan,
  TenantSubscription,
  PaymentRecord,
  PaymentHistoryResponse,
};
