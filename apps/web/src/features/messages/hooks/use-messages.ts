import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ApiResponse, ApiPagedResponse } from '@/lib/types';
import type { Conversation, Message } from '../types';

export function useConversations(search?: string) {
  return useQuery({
    queryKey: ['conversations', { search }],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.set('sort', '-lastMessageAt');
      if (search) {
        searchParams.set('search', search);
      }
      const { data } = await api.get<ApiPagedResponse<Conversation>>(
        `/conversations?${searchParams.toString()}`,
      );
      return data;
    },
  });
}

export function useMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const { data } = await api.get<ApiPagedResponse<Message>>(
        `/conversations/${conversationId}/messages?pageSize=50&sort=-createdAt`,
      );
      return data;
    },
    enabled: !!conversationId,
    refetchInterval: 5000,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      text,
      attachments,
    }: {
      conversationId: string;
      text: string;
      attachments?: File[];
    }) => {
      const payload: Record<string, unknown> = { text };
      if (attachments?.length) {
        const formData = new FormData();
        formData.append('text', text);
        attachments.forEach((file) => formData.append('attachments', file));
        const { data } = await api.post<ApiResponse<Message>>(
          `/conversations/${conversationId}/messages`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } },
        );
        return data.data;
      }

      const { data } = await api.post<ApiResponse<Message>>(
        `/conversations/${conversationId}/messages`,
        payload,
      );
      return data.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
