import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ApiPagedResponse, ApiResponse } from '@/lib/types';
import type { Guest } from '../types';
import type { CreateGuestDto } from '../schemas';

interface UseGuestsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  rsvp?: string;
  group?: string;
  side?: string;
  sort?: string;
}

export function useGuests(params: UseGuestsParams = {}) {
  return useQuery({
    queryKey: ['guests', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.set('page', String(params.page));
      if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));
      if (params.search) searchParams.set('search', params.search);
      if (params.rsvp && params.rsvp !== 'all') searchParams.set('filter[rsvp]', params.rsvp);
      if (params.group && params.group !== 'all') searchParams.set('filter[group]', params.group);
      if (params.side && params.side !== 'all') searchParams.set('filter[side]', params.side);
      if (params.sort) searchParams.set('sort', params.sort);

      const { data } = await api.get<ApiPagedResponse<Guest>>(
        `/weddings/me/guests?${searchParams.toString()}`,
      );
      return data;
    },
  });
}

export function useCreateGuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateGuestDto) => {
      const { data } = await api.post<ApiResponse<Guest>>('/weddings/me/guests', dto);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
    },
  });
}

export function useDeleteGuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (guestId: string) => {
      await api.delete(`/weddings/me/guests/${guestId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
    },
  });
}

export function useImportGuests() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post<ApiResponse<{ imported: number }>>(
        '/weddings/me/guests/import',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
    },
  });
}
