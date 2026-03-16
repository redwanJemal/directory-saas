import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ApiResponse, ApiPagedResponse } from '@/lib/types';
import type { Booking, BookingStatus } from '../types';
import type { SendQuoteDto, UpdateStatusDto } from '../schemas';

export function useBookings(params: {
  page?: number;
  pageSize?: number;
  status?: BookingStatus[] | null;
  search?: string;
}) {
  const { page = 1, pageSize = 20, status, search } = params;

  return useQuery({
    queryKey: ['bookings', { page, pageSize, status, search }],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.set('page', String(page));
      searchParams.set('pageSize', String(pageSize));
      if (status?.length) {
        searchParams.set('filter[status]', status.join(','));
      }
      if (search) {
        searchParams.set('search', search);
      }
      const { data } = await api.get<ApiPagedResponse<Booking>>(
        `/bookings?${searchParams.toString()}`,
      );
      return data;
    },
  });
}

export function useBooking(id: string | null) {
  return useQuery({
    queryKey: ['bookings', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Booking>>(`/bookings/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useSendQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, dto }: { bookingId: string; dto: SendQuoteDto }) => {
      const { data } = await api.post<ApiResponse<Booking>>(
        `/bookings/${bookingId}/quote`,
        dto,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, dto }: { bookingId: string; dto: UpdateStatusDto }) => {
      const { data } = await api.patch<ApiResponse<Booking>>(
        `/bookings/${bookingId}/status`,
        dto,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}
