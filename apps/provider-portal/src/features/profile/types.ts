export interface ProviderProfile {
  id: string;
  businessName: string;
  description: string;
  category: string;
  location: string;
  city: string;
  state: string;
  country: string;
  styles: string[];
  languages: string[];
  phone: string;
  email: string;
  website: string;
  whatsapp: string | null;
  whatsappMessage: string | null;
  instagram: string | null;
  tiktok: string | null;
  logoUrl: string | null;
  coverPhotoUrl: string | null;
  businessHours: Record<string, { open: string; close: string }> | null;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderCategory {
  id: string;
  name: string;
  slug: string;
  isPrimary: boolean;
}

export interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  children?: CategoryOption[];
}

export interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  priceType: 'fixed' | 'starting_from' | 'hourly' | 'custom';
  duration: string;
  inclusions: string[];
  sortOrder: number;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
}

export interface AvailabilityDate {
  date: string;
  status: 'available' | 'booked' | 'blocked';
}

export interface PortfolioItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl: string | null;
  title: string;
  description: string;
  eventDate: string | null;
  venue: string | null;
  isCover: boolean;
  sortOrder: number;
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
