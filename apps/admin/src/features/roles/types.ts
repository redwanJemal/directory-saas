export interface Role {
  id: string;
  name: string;
  description?: string;
  tenantId?: string;
  tenant?: {
    id: string;
    name: string;
  };
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleInput {
  name: string;
  description?: string;
  permissions: string[];
  tenantId?: string;
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  permissions?: string[];
}
