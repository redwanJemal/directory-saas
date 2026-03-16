export interface VendorSearchResult {
  id: string;
  name: string;
  slug: string;
  category: string;
  location: string;
  coverPhoto: string | null;
  rating: number;
  reviewCount: number;
  startingPrice: number;
  featured: boolean;
  description: string;
  styles: string[];
  languages: string[];
}

export interface SearchParams {
  query?: string;
  category?: string;
  location?: string;
  date?: string;
  minBudget?: number;
  maxBudget?: number;
  minRating?: number;
  styles?: string[];
  languages?: string[];
  sort?: string;
  page?: number;
  pageSize?: number;
}

export interface VendorProfile {
  id: string;
  name: string;
  slug: string;
  category: string;
  location: string;
  coverPhoto: string | null;
  avatar: string | null;
  description: string;
  rating: number;
  reviewCount: number;
  startingPrice: number;
  responseTime: string;
  styles: string[];
  languages: string[];
  contactEmail: string;
  contactPhone: string;
  website: string | null;
  portfolio: PortfolioImage[];
  packages: VendorPackage[];
  reviews: VendorReview[];
  faqs: VendorFaq[];
}

export interface PortfolioImage {
  id: string;
  url: string;
  title: string;
  description: string;
}

export interface VendorPackage {
  id: string;
  name: string;
  price: number;
  description: string;
  inclusions: string[];
  popular: boolean;
}

export interface VendorReview {
  id: string;
  rating: number;
  text: string;
  authorName: string;
  authorAvatar: string | null;
  createdAt: string;
}

export interface VendorFaq {
  id: string;
  question: string;
  answer: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  vendorCount: number;
  description: string;
}
