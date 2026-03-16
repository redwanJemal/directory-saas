import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ApiResponse, ApiPagedResponse } from '@/lib/types';
import type { TeamMember, TenantRole } from '../types';
import type { InviteMemberDto, ChangeRoleDto } from '../schemas';

export function useTeamMembers(params: {
  page?: number;
  pageSize?: number;
  search?: string;
}) {
  const { page = 1, pageSize = 20, search } = params;

  return useQuery({
    queryKey: ['team', { page, pageSize, search }],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.set('page', String(page));
      searchParams.set('pageSize', String(pageSize));
      if (search) {
        searchParams.set('search', search);
      }
      const { data } = await api.get<ApiPagedResponse<TeamMember>>(
        `/tenants/me/users?${searchParams.toString()}`,
      );
      return data;
    },
  });
}

export function useTenantRoles() {
  return useQuery({
    queryKey: ['tenant-roles'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<TenantRole[]>>('/tenants/me/roles');
      return data.data;
    },
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: InviteMemberDto) => {
      const { data } = await api.post<ApiResponse<TeamMember>>(
        '/tenants/me/users/invite',
        dto,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
    },
  });
}

export function useChangeRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, dto }: { userId: string; dto: ChangeRoleDto }) => {
      const { data } = await api.patch<ApiResponse<TeamMember>>(
        `/tenants/me/users/${userId}/role`,
        dto,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/tenants/me/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
    },
  });
}
