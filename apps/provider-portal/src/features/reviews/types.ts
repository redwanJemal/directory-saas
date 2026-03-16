export interface Review {
  id: string;
  tenantId: string;
  clientName: string;
  rating: number;
  text: string;
  photos?: string[];
  response?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RatingDistribution {
  [key: number]: number;
}

export interface ReviewSummary {
  average: number;
  total: number;
  distribution: RatingDistribution;
}
