import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  SearchParams,
  VendorSearchResult,
  VendorProfile,
  Category,
  Country,
  City,
  Deal,
} from '../types';
import type { ApiPagedResponse, ApiResponse } from '@/lib/types';

export function useSearchQuery(params: SearchParams) {
  return useQuery({
    queryKey: ['vendor-search', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params.query) queryParams.set('q', params.query);
      if (params.category) queryParams.set('filter[category]', params.category);
      if (params.country) queryParams.set('filter[country]', params.country);
      if (params.city) queryParams.set('filter[city]', params.city);
      if (params.location) queryParams.set('filter[location]', params.location);
      if (params.minBudget) queryParams.set('filter[price][gte]', String(params.minBudget));
      if (params.maxBudget) queryParams.set('filter[price][lte]', String(params.maxBudget));
      if (params.minRating) queryParams.set('filter[rating][gte]', String(params.minRating));
      if (params.verified) queryParams.set('filter[verified]', 'true');
      if (params.hasDeals) queryParams.set('filter[hasDeals]', 'true');
      if (params.styles?.length) queryParams.set('filter[style]', params.styles.join(','));
      if (params.languages?.length) queryParams.set('filter[language]', params.languages.join(','));
      if (params.sort) queryParams.set('sort', params.sort);
      if (params.page) queryParams.set('page', String(params.page));
      if (params.pageSize) queryParams.set('pageSize', String(params.pageSize));

      const response = await api.get<ApiPagedResponse<VendorSearchResult>>(
        `/search/providers?${queryParams}`,
      );
      return response.data;
    },
    placeholderData: (prev) => prev,
  });
}

export function useVendorProfile(vendorId: string) {
  return useQuery({
    queryKey: ['vendor-profile', vendorId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<VendorProfile>>(
        `/providers/${vendorId}`,
      );
      return response.data.data;
    },
    enabled: !!vendorId,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Category[]>>('/categories?withCount=true');
      return response.data.data;
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useCountries() {
  return useQuery({
    queryKey: ['countries'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Country[]>>('/locations/countries');
      return response.data.data;
    },
    staleTime: 30 * 60 * 1000,
  });
}

export function useCities(countryCode: string | undefined) {
  return useQuery({
    queryKey: ['cities', countryCode],
    queryFn: async () => {
      const response = await api.get<ApiResponse<City[]>>(
        `/locations/countries/${countryCode}/cities`,
      );
      return response.data.data;
    },
    enabled: !!countryCode,
    staleTime: 30 * 60 * 1000,
  });
}

export function useFeaturedDeals() {
  return useQuery({
    queryKey: ['deals', 'featured'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Deal[]>>('/deals/featured');
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useDeals(params?: { country?: string; city?: string; category?: string; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: ['deals', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params?.country) queryParams.set('country', params.country);
      if (params?.city) queryParams.set('city', params.city);
      if (params?.category) queryParams.set('category', params.category);
      if (params?.page) queryParams.set('page', String(params.page));
      if (params?.pageSize) queryParams.set('pageSize', String(params.pageSize));
      const response = await api.get<ApiPagedResponse<Deal>>(`/deals?${queryParams}`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
