export interface AdminReview {
  id: string;
  tenantId: string;
  clientId: string;
  rating: number;
  title: string | null;
  comment: string | null;
  response: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    firstName: string;
    lastName: string;
  };
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
}
