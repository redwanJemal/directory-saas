import { useCallback } from 'react';
import { View, Text, Pressable, FlatList, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useConversations, type Conversation } from '@/hooks/api/use-messages';
import { Skeleton } from '@/components/skeleton';
import { EmptyState } from '@/components/empty-state';

export function MessagesView() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: conversations, isLoading, refetch, isRefetching } = useConversations();

  const renderItem = useCallback(
    ({ item }: { item: Conversation }) => (
      <ConversationItem
        conversation={item}
        onPress={() => router.push(`/chat/${item.id}` as never)}
      />
    ),
    [router],
  );

  if (isLoading) {
    return (
      <View className="flex-1 px-4 pt-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <View key={i} className="mb-3 flex-row items-center p-3">
            <Skeleton width={48} height={48} borderRadius={24} />
            <View className="ml-3 flex-1">
              <Skeleton width="60%" height={16} />
              <Skeleton width="80%" height={12} className="mt-1" />
            </View>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View className="flex-1">
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#4c6ef5" />
        }
        ListEmptyComponent={
          <EmptyState
            icon="chatbubbles-outline"
            title={t('messages.noMessages')}
          />
        }
      />
    </View>
  );
}

function ConversationItem({
  conversation,
  onPress,
}: {
  conversation: Conversation;
  onPress: () => void;
}) {
  const timeAgo = getRelativeTime(conversation.lastMessageAt);

  return (
    <Pressable
      className="mx-4 mb-1 flex-row items-center rounded-card p-3 active:bg-surface-secondary"
      onPress={onPress}
    >
      {/* Avatar */}
      <View className="mr-3 h-12 w-12 items-center justify-center rounded-full bg-brand-100">
        <Text className="text-lg font-bold text-brand-600">
          {conversation.vendor.businessName.charAt(0).toUpperCase()}
        </Text>
      </View>

      {/* Content */}
      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold text-content" numberOfLines={1}>
            {conversation.vendor.businessName}
          </Text>
          <Text className="text-xs text-content-secondary">{timeAgo}</Text>
        </View>
        <Text className="mt-0.5 text-sm text-content-secondary" numberOfLines={1}>
          {conversation.lastMessage}
        </Text>
      </View>

      {/* Unread badge */}
      {conversation.unreadCount > 0 && (
        <View className="ml-2 h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-600 px-1.5">
          <Text className="text-xs font-bold text-content-inverse">
            {conversation.unreadCount}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function getRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString();
}
