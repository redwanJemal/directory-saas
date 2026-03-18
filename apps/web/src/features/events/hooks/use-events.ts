import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ApiResponse, ApiPagedResponse } from '@/lib/types';

export interface PublicEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string | null;
  location: string | null;
  city: string | null;
  country: string | null;
  imageUrl: string | null;
  maxAttendees: number | null;
  eventType: 'business' | 'community';
  rsvpCount: number;
  createdAt: string;
  provider: {
    id: string;
    name: string;
    slug: string;
    city: string;
    country: string;
    coverPhoto: string | null;
    verified: boolean;
  };
}

export interface EventRsvp {
  id: string;
  eventId: string;
  userId: string;
  status: 'going' | 'interested' | 'not-going';
}

export function usePublicEvents(params?: {
  country?: string;
  city?: string;
  category?: string;
  eventType?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ['public-events', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params?.country) queryParams.set('country', params.country);
      if (params?.city) queryParams.set('city', params.city);
      if (params?.category) queryParams.set('category', params.category);
      if (params?.eventType) queryParams.set('eventType', params.eventType);
      if (params?.page) queryParams.set('page', String(params.page));
      if (params?.pageSize) queryParams.set('pageSize', String(params.pageSize));
      const response = await api.get<ApiPagedResponse<PublicEvent>>(`/community-events?${queryParams}`);
      return response.data;
    },
  });
}

export function useUpcomingEvents() {
  return useQuery({
    queryKey: ['upcoming-events'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<PublicEvent[]>>('/community-events/upcoming');
      return response.data.data;
    },
  });
}

export function useProviderEvents(providerId: string | undefined) {
  return useQuery({
    queryKey: ['provider-events', providerId],
    queryFn: async () => {
      const response = await api.get<ApiPagedResponse<PublicEvent>>(`/community-events/provider/${providerId}`);
      return response.data;
    },
    enabled: !!providerId,
  });
}

export function useRsvpMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, status }: { eventId: string; status: string }) => {
      const response = await api.post<ApiResponse<EventRsvp>>(`/community-events/${eventId}/rsvp`, { status });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-events'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-events'] });
      queryClient.invalidateQueries({ queryKey: ['my-rsvp'] });
    },
  });
}

export function useMyRsvp(eventId: string | undefined) {
  return useQuery({
    queryKey: ['my-rsvp', eventId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<EventRsvp | null>>(`/community-events/${eventId}/rsvp/me`);
      return response.data.data;
    },
    enabled: !!eventId,
  });
}
