import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type BookingStatus = 'INQUIRY' | 'QUOTED' | 'BOOKED' | 'COMPLETED' | 'CANCELLED';

export interface Booking {
  id: string;
  vendorId: string;
  vendor: {
    id: string;
    businessName: string;
    category: string;
    coverImage: string | null;
  };
  status: BookingStatus;
  message: string;
  quotedPrice: number | null;
  eventDate: string | null;
  guestCount: number | null;
  createdAt: string;
  updatedAt: string;
}

export function useBookings(status?: string) {
  return useQuery({
    queryKey: ['bookings', status],
    queryFn: async () => {
      const params = status ? `?filter[status]=${status}` : '';
      const response = await api.get(`/bookings${params}`);
      return response.data as Booking[];
    },
  });
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: async () => {
      const response = await api.get(`/bookings/${id}`);
      return response.data as Booking;
    },
    enabled: !!id,
  });
}

export function useAcceptQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await api.patch(`/bookings/${bookingId}/accept`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking'] });
    },
  });
}

export function useDeclineQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await api.patch(`/bookings/${bookingId}/decline`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking'] });
    },
  });
}
