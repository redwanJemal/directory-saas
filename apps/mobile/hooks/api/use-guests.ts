import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Guest {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  side: 'bride' | 'groom' | 'both';
  relationship: string;
  rsvpStatus: 'pending' | 'attending' | 'declined';
  mealChoice: string | null;
  plusOne: boolean;
  events: string[];
}

export interface GuestSummary {
  total: number;
  attending: number;
  declined: number;
  pending: number;
}

export function useGuests(search?: string) {
  return useQuery({
    queryKey: ['guests', search],
    queryFn: async () => {
      const params = search ? `?filter[name][contains]=${search}` : '';
      const response = await api.get(`/wedding/guests${params}`);
      return response.data as Guest[];
    },
  });
}

export function useGuestSummary() {
  return useQuery({
    queryKey: ['guests', 'summary'],
    queryFn: async () => {
      const response = await api.get('/wedding/guests/summary');
      return response.data as GuestSummary;
    },
  });
}

export function useCreateGuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Guest, 'id'>) => {
      const response = await api.post('/wedding/guests', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
    },
  });
}

export function useUpdateGuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Guest> & { id: string }) => {
      const response = await api.patch(`/wedding/guests/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
    },
  });
}

export function useDeleteGuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/wedding/guests/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
    },
  });
}
