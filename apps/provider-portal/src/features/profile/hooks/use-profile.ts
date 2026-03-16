import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ProviderProfile, Package, FAQ, AvailabilityDate } from '../types';

// Profile
export function useProfileQuery() {
  return useQuery({
    queryKey: ['provider-profile'],
    queryFn: async () => {
      const response = await api.get<{ data: ProviderProfile }>('/providers/me');
      return response.data.data;
    },
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<ProviderProfile>) => {
      const response = await api.patch<{ data: ProviderProfile }>('/providers/me', data);
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['provider-profile'] }),
  });
}

// Packages
export function usePackagesQuery() {
  return useQuery({
    queryKey: ['provider-packages'],
    queryFn: async () => {
      const response = await api.get<{ data: Package[] }>('/providers/me/packages');
      return response.data.data;
    },
  });
}

export function useCreatePackageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Package, 'id' | 'sortOrder'>) => {
      const response = await api.post<{ data: Package }>('/providers/me/packages', data);
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['provider-packages'] }),
  });
}

export function useUpdatePackageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Package> & { id: string }) => {
      const response = await api.patch<{ data: Package }>(`/providers/me/packages/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['provider-packages'] }),
  });
}

export function useDeletePackageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/providers/me/packages/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['provider-packages'] }),
  });
}

export function useReorderPackagesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      await api.patch('/providers/me/packages/reorder', { ids: orderedIds });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['provider-packages'] }),
  });
}

// FAQs
export function useFAQsQuery() {
  return useQuery({
    queryKey: ['provider-faqs'],
    queryFn: async () => {
      const response = await api.get<{ data: FAQ[] }>('/providers/me/faqs');
      return response.data.data;
    },
  });
}

export function useCreateFAQMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<FAQ, 'id' | 'sortOrder'>) => {
      const response = await api.post<{ data: FAQ }>('/providers/me/faqs', data);
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['provider-faqs'] }),
  });
}

export function useUpdateFAQMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<FAQ> & { id: string }) => {
      const response = await api.patch<{ data: FAQ }>(`/providers/me/faqs/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['provider-faqs'] }),
  });
}

export function useDeleteFAQMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/providers/me/faqs/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['provider-faqs'] }),
  });
}

export function useReorderFAQsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      await api.patch('/providers/me/faqs/reorder', { ids: orderedIds });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['provider-faqs'] }),
  });
}

// Availability
export function useAvailabilityQuery(month: string) {
  return useQuery({
    queryKey: ['provider-availability', month],
    queryFn: async () => {
      const response = await api.get<{ data: AvailabilityDate[] }>(`/providers/me/availability?month=${month}`);
      return response.data.data;
    },
  });
}

export function useUpdateAvailabilityMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dates: Array<{ date: string; status: string }>) => {
      await api.patch('/providers/me/availability', { dates });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['provider-availability'] }),
  });
}
