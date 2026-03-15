export interface User {
  id: string;
  name: string;
  email: string;
  type: 'admin' | 'tenant' | 'client';
  status: 'active' | 'inactive' | 'suspended';
  tenantId?: string;
  tenant?: {
    id: string;
    name: string;
  };
  role?: {
    id: string;
    name: string;
  };
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}
