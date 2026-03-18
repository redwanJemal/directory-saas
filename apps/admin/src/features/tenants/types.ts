export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'suspended' | 'cancelled';
  planId?: string;
  plan?: {
    id: string;
    name: string;
  };
  usersCount?: number;
  providerProfile?: {
    country: string | null;
    city: string | null;
    isVerified: boolean;
    isFeatured: boolean;
    categories: Array<{
      category: {
        id: string;
        name: string;
        slug: string;
      };
    }>;
    _count?: {
      contactClicks: number;
    };
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTenantInput {
  name: string;
  slug: string;
  ownerEmail: string;
  planId?: string;
}

export interface UpdateTenantInput {
  name?: string;
  status?: string;
}

export interface SuspendTenantInput {
  reason: string;
}
