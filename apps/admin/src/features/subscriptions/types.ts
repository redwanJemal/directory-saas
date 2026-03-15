export interface Subscription {
  id: string;
  tenantId: string;
  tenant?: {
    id: string;
    name: string;
  };
  planId: string;
  plan?: {
    id: string;
    name: string;
  };
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price?: number;
}
