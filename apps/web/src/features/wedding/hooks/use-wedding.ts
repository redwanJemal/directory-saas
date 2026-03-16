import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ApiResponse } from '@/lib/types';
import type { Wedding } from '../types';
import type { UpdateWeddingDto, CreateEventDto, InviteCollaboratorDto } from '../schemas';

export function useWedding() {
  return useQuery({
    queryKey: ['wedding', 'me'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Wedding>>('/weddings/me');
      return data.data;
    },
  });
}

export function useUpdateWedding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: UpdateWeddingDto) => {
      const { data } = await api.patch<ApiResponse<Wedding>>('/weddings/me', dto);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wedding', 'me'] });
    },
  });
}

export function useAddEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateEventDto) => {
      const { data } = await api.post<ApiResponse<unknown>>('/weddings/me/events', dto);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wedding', 'me'] });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (eventId: string) => {
      await api.delete(`/weddings/me/events/${eventId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wedding', 'me'] });
    },
  });
}

export function useInviteCollaborator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: InviteCollaboratorDto) => {
      const { data } = await api.post<ApiResponse<unknown>>('/weddings/me/collaborators', dto);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wedding', 'me'] });
    },
  });
}

export function useRemoveCollaborator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (collaboratorId: string) => {
      await api.delete(`/weddings/me/collaborators/${collaboratorId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wedding', 'me'] });
    },
  });
}
