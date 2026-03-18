export interface VendorSearchResult {
  id: string;
  name: string;
  slug: string;
  category: string;
  categories: CategoryBadge[];
  location: string;
  country: string;
  city: string;
  coverPhoto: string | null;
  rating: number;
  reviewCount: number;
  startingPrice: number;
  featured: boolean;
  verified: boolean;
  description: string;
  whatsapp: string | null;
  activeDeals: number;
  styles: string[];
  languages: string[];
}

export interface CategoryBadge {
  id: string;
  name: string;
  slug: string;
  isPrimary: boolean;
}

export interface SearchParams {
  query?: string;
  category?: string;
  country?: string;
  city?: string;
  location?: string;
  date?: string;
  minBudget?: number;
  maxBudget?: number;
  minRating?: number;
  verified?: boolean;
  hasDeals?: boolean;
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
  categories: CategoryBadge[];
  location: string;
  country: string;
  city: string;
  coverPhoto: string | null;
  avatar: string | null;
  description: string;
  rating: number;
  reviewCount: number;
  startingPrice: number;
  responseTime: string;
  verified: boolean;
  whatsapp: string | null;
  whatsappUrl: string | null;
  styles: string[];
  languages: string[];
  contactEmail: string;
  contactPhone: string;
  website: string | null;
  instagram: string | null;
  tiktok: string | null;
  businessHours: Record<string, string> | null;
  portfolio: PortfolioImage[];
  packages: VendorPackage[];
  reviews: VendorReview[];
  faqs: VendorFaq[];
  deals: VendorDeal[];
}

export interface VendorDeal {
  id: string;
  title: string;
  description: string;
  discountPercent: number | null;
  originalPrice: number | null;
  dealPrice: number | null;
  imageUrl: string | null;
  startsAt: string | null;
  expiresAt: string | null;
}

export interface ReviewSummary {
  average: number;
  total: number;
  distribution: Record<number, number>;
}

export interface RelatedBusiness {
  id: string;
  name: string;
  slug: string;
  category: string;
  categories: CategoryBadge[];
  location: string;
  country: string;
  city: string;
  coverPhoto: string | null;
  rating: number;
  reviewCount: number;
  startingPrice: number;
  verified: boolean;
  whatsapp: string | null;
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
  color: string;
  vendorCount: number;
  description: string;
  children?: Category[];
}

export interface Country {
  code: string;
  name: string;
  nameAm: string;
  nameAr: string;
}

export interface City {
  name: string;
  nameAm: string;
  nameAr: string;
}

export interface Deal {
  id: string;
  title: string;
  description: string;
  discountPercent: number | null;
  originalPrice: number | null;
  dealPrice: number | null;
  imageUrl: string | null;
  startsAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  provider: {
    id: string;
    name: string;
    slug: string;
    city: string;
    country: string;
    coverPhoto: string | null;
    verified: boolean;
  };
}
