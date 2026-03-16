import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ApiResponse } from '@/lib/types';

export interface CalendarEvent {
  id: string;
  date: string;
  type: 'booking' | 'blocked';
  title?: string;
  status?: string;
  clientName?: string;
}

export function useCalendarEvents(year: number, month: number) {
  return useQuery({
    queryKey: ['calendar', year, month],
    queryFn: async () => {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endMonth = month === 12 ? 1 : month + 1;
      const endYear = month === 12 ? year + 1 : year;
      const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

      const { data } = await api.get<ApiResponse<CalendarEvent[]>>(
        `/bookings/calendar?startDate=${startDate}&endDate=${endDate}`,
      );
      return data.data;
    },
  });
}

export function useBlockDate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (date: string) => {
      const { data } = await api.post<ApiResponse<CalendarEvent>>(
        '/availability/block',
        { date },
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
}

export function useUnblockDate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (date: string) => {
      await api.delete(`/availability/block/${date}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
}
