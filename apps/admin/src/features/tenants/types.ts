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
