import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface SearchParams {
  query?: string;
  category?: string;
  country?: string;
  city?: string;
  priceMin?: number;
  priceMax?: number;
  ratingMin?: number;
  sort?: string;
}

export interface Vendor {
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
}

interface PaginatedResponse {
  data: Vendor[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

export function useSearchVendors(params: SearchParams) {
  return useInfiniteQuery({
    queryKey: ['vendors', 'search', params],
    queryFn: async ({ pageParam = 1 }) => {
      const searchParams = new URLSearchParams();
      if (params.query) searchParams.set('q', params.query);
      if (params.category) searchParams.set('filter[category]', params.category);
      if (params.country) searchParams.set('filter[country]', params.country);
      if (params.city) searchParams.set('filter[city]', params.city);
      if (params.priceMin) searchParams.set('filter[startingPrice][gte]', String(params.priceMin));
      if (params.priceMax) searchParams.set('filter[startingPrice][lte]', String(params.priceMax));
      if (params.ratingMin) searchParams.set('filter[rating][gte]', String(params.ratingMin));
      if (params.sort) searchParams.set('sort', params.sort);
      searchParams.set('page', String(pageParam));
      searchParams.set('pageSize', '20');

      const response = await api.get<PaginatedResponse>(`/search?${searchParams.toString()}`);
      return response.data as PaginatedResponse;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });
}
