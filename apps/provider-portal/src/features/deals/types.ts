export interface Deal {
  id: string;
  title: string;
  description: string | null;
  discountPercent: number | null;
  originalPrice: number | null;
  dealPrice: number | null;
  imageUrl: string | null;
  startsAt: string | null;
  expiresAt: string | null;
  status: 'active' | 'expired' | 'scheduled';
  createdAt: string;
  updatedAt: string;
}
