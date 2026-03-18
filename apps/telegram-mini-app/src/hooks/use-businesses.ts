import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface SearchParams {
  q?: string;
  category?: string;
  country?: string;
  city?: string;
  page?: number;
  pageSize?: number;
}

export function useSearchBusinesses(params: SearchParams) {
  return useQuery({
    queryKey: ['search-businesses', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params.q) searchParams.set('q', params.q);
      if (params.category) searchParams.set('category', params.category);
      if (params.country) searchParams.set('country', params.country);
      if (params.city) searchParams.set('city', params.city);
      searchParams.set('page', String(params.page ?? 1));
      searchParams.set('pageSize', String(params.pageSize ?? 20));
      const { data } = await api.get(`/search/providers?${searchParams}`);
      return data;
    },
    enabled: !!(params.q || params.category || params.country || params.city),
  });
}

export function useFeaturedBusinesses() {
  return useQuery({
    queryKey: ['featured-businesses'],
    queryFn: async () => {
      const { data } = await api.get('/search/providers?sort=-rating&pageSize=10&verified=true');
      return data;
    },
  });
}

export function useBusinessProfile(vendorId: string | null) {
  return useQuery({
    queryKey: ['business-profile', vendorId],
    queryFn: async () => {
      const { data } = await api.get(`/providers/${vendorId}`);
      return data;
    },
    enabled: !!vendorId,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get('/categories?withCount=true');
      return data;
    },
  });
}

export function useDeals() {
  return useQuery({
    queryKey: ['deals'],
    queryFn: async () => {
      const { data } = await api.get('/deals?pageSize=20');
      return data;
    },
  });
}
