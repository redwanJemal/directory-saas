import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Country {
  code: string;
  name: string;
  nameAm?: string;
  nameAr?: string;
}

export interface City {
  slug: string;
  name: string;
  nameAm?: string;
  nameAr?: string;
}

export function useCountries() {
  return useQuery({
    queryKey: ['locations', 'countries'],
    queryFn: async () => {
      const response = await api.get<Country[]>('/locations/countries');
      return response.data as Country[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useCities(countryCode: string | null) {
  return useQuery({
    queryKey: ['locations', 'cities', countryCode],
    queryFn: async () => {
      const response = await api.get<City[]>(`/locations/countries/${countryCode}/cities`);
      return response.data as City[];
    },
    enabled: !!countryCode,
    staleTime: 1000 * 60 * 60,
  });
}
