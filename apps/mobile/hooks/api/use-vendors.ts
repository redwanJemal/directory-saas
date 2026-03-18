import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface VendorDetail {
  id: string;
  businessName: string;
  slug: string;
  category: string;
  description: string;
  location: string;
  rating: number;
  reviewCount: number;
  startingPrice: number | null;
  coverImage: string | null;
  isVerified: boolean;
  phone?: string;
  email?: string;
  website?: string;
  operatingHours?: Record<string, string>;
  socialLinks?: Record<string, string>;
}

export interface PortfolioItem {
  id: string;
  imageUrl: string;
  caption?: string;
}

export interface VendorPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  includes: string[];
}

export interface Review {
  id: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface InquiryData {
  vendorId: string;
  eventDate?: string;
  guestCount?: number;
  message: string;
  budgetRange?: string;
}

export function useVendor(id: string) {
  return useQuery({
    queryKey: ['vendor', id],
    queryFn: async () => {
      const response = await api.get<VendorDetail>(`/providers/${id}`);
      return response.data as VendorDetail;
    },
    enabled: !!id,
  });
}

export function useVendorPortfolio(vendorId: string) {
  return useQuery({
    queryKey: ['vendor', vendorId, 'portfolio'],
    queryFn: async () => {
      const response = await api.get<PortfolioItem[]>(`/providers/${vendorId}/portfolio`);
      return response.data as PortfolioItem[];
    },
    enabled: !!vendorId,
  });
}

export function useVendorPackages(vendorId: string) {
  return useQuery({
    queryKey: ['vendor', vendorId, 'packages'],
    queryFn: async () => {
      const response = await api.get<VendorPackage[]>(`/providers/${vendorId}/packages`);
      return response.data as VendorPackage[];
    },
    enabled: !!vendorId,
  });
}

export function useVendorReviews(vendorId: string) {
  return useQuery({
    queryKey: ['vendor', vendorId, 'reviews'],
    queryFn: async () => {
      const response = await api.get<Review[]>(`/providers/${vendorId}/reviews`);
      return response.data as Review[];
    },
    enabled: !!vendorId,
  });
}

export function useFeaturedVendors(country?: string | null, city?: string | null) {
  return useQuery({
    queryKey: ['vendors', 'featured', country, city],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('filter[isFeatured]', 'true');
      params.set('pageSize', '10');
      if (country) params.set('filter[country]', country);
      if (city) params.set('filter[city]', city);
      const response = await api.get(`/providers?${params.toString()}`);
      return response.data;
    },
  });
}

export function useSendInquiry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InquiryData) => {
      const response = await api.post('/bookings/inquiries', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}
