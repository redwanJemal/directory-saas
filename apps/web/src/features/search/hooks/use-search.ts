import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { SearchParams, VendorSearchResult, VendorProfile, Category } from '../types';
import type { ApiPagedResponse, ApiResponse } from '@/lib/types';

export function useSearchQuery(params: SearchParams) {
  return useQuery({
    queryKey: ['vendor-search', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params.query) queryParams.set('q', params.query);
      if (params.category) queryParams.set('filter[category]', params.category);
      if (params.location) queryParams.set('filter[location]', params.location);
      if (params.minBudget) queryParams.set('filter[price][gte]', String(params.minBudget));
      if (params.maxBudget) queryParams.set('filter[price][lte]', String(params.maxBudget));
      if (params.minRating) queryParams.set('filter[rating][gte]', String(params.minRating));
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
      const response = await api.get<ApiResponse<Category[]>>('/categories');
      return response.data.data;
    },
    staleTime: 10 * 60 * 1000,
  });
}
