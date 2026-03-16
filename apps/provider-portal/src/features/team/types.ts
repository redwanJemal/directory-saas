export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joinedAt: string;
  avatarUrl?: string;
}

export interface TenantRole {
  id: string;
  name: string;
  description?: string;
}
