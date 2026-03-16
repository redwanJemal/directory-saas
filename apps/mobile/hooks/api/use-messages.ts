import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Conversation {
  id: string;
  vendorId: string;
  vendor: {
    id: string;
    businessName: string;
    coverImage: string | null;
  };
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: 'client' | 'vendor';
  content: string;
  createdAt: string;
}

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await api.get('/messages/conversations');
      return response.data as Conversation[];
    },
  });
}

export function useMessages(conversationId: string) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const response = await api.get(`/messages/conversations/${conversationId}`);
      return response.data as Message[];
    },
    enabled: !!conversationId,
    refetchInterval: 10000,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { conversationId: string; content: string }) => {
      const response = await api.post(
        `/messages/conversations/${data.conversationId}`,
        { content: data.content },
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['messages', variables.conversationId],
      });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
