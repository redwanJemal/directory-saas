import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Category {
  id: string;
  name: string;
  slug: string;
  vendorCount?: number;
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get<Category[]>('/categories');
      return response.data as Category[];
    },
    staleTime: 1000 * 60 * 30,
  });
}
