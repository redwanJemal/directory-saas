import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useMessages, useSendMessage, useConversations, type Message } from '@/hooks/api/use-messages';
import { useAuthStore } from '@/store/auth-store';
import { Skeleton } from '@/components/skeleton';

export default function ChatScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [messageText, setMessageText] = useState('');
  const flatListRef = useRef<FlatList<Message>>(null);

  const { data: messages, isLoading } = useMessages(conversationId);
  const { data: conversations } = useConversations();
  const sendMessage = useSendMessage();

  const conversation = conversations?.find((c) => c.id === conversationId);
  const vendorName = conversation?.vendor.businessName ?? '';

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages?.length]);

  const handleSend = async () => {
    if (!messageText.trim() || !conversationId) return;

    const text = messageText.trim();
    setMessageText('');

    try {
      await sendMessage.mutateAsync({
        conversationId,
        content: text,
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      setMessageText(text);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isSent = item.senderType === 'client';
    const showTimestamp =
      index === 0 ||
      new Date(item.createdAt).getTime() -
        new Date((messages ?? [])[index - 1]?.createdAt ?? '').getTime() >
        300000; // 5 min gap

    return (
      <View>
        {showTimestamp && (
          <Text className="my-2 text-center text-xs text-content-tertiary">
            {formatMessageTime(item.createdAt)}
          </Text>
        )}
        <View
          className={`mb-1 max-w-[80%] ${isSent ? 'self-end' : 'self-start'}`}
        >
          <View
            className={`rounded-2xl px-3.5 py-2.5 ${
              isSent ? 'rounded-br-sm bg-brand-600' : 'rounded-bl-sm bg-surface-secondary'
            }`}
          >
            <Text
              className={`text-base ${
                isSent ? 'text-content-inverse' : 'text-content'
              }`}
            >
              {item.content}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center border-b border-border px-4 py-3">
        <Pressable onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#1a1b1e" />
        </Pressable>
        <View className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-brand-100">
          <Text className="text-sm font-bold text-brand-600">
            {vendorName.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>
        <Text className="flex-1 text-lg font-semibold text-content" numberOfLines={1}>
          {vendorName}
        </Text>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        {isLoading ? (
          <View className="flex-1 px-4 pt-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <View
                key={i}
                className={`mb-3 ${i % 2 === 0 ? 'self-start' : 'self-end'}`}
              >
                <Skeleton
                  width={i % 2 === 0 ? 200 : 180}
                  height={40}
                  borderRadius={16}
                />
              </View>
            ))}
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={{ padding: 16, flexGrow: 1, justifyContent: 'flex-end' }}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
          />
        )}

        {/* Input */}
        <View className="flex-row items-end border-t border-border bg-surface px-4 py-2">
          <TextInput
            className="mr-2 max-h-24 min-h-[40px] flex-1 rounded-2xl border border-border bg-surface-secondary px-4 py-2 text-base text-content"
            placeholder={t('messages.typeMessage')}
            placeholderTextColor="#868e96"
            value={messageText}
            onChangeText={setMessageText}
            multiline
            textAlignVertical="center"
          />
          <Pressable
            className={`h-10 w-10 items-center justify-center rounded-full ${
              messageText.trim() ? 'bg-brand-600' : 'bg-surface-secondary'
            }`}
            onPress={handleSend}
            disabled={!messageText.trim() || sendMessage.isPending}
          >
            <Ionicons
              name="send"
              size={18}
              color={messageText.trim() ? '#fff' : '#868e96'}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isToday) return time;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `${date.toLocaleDateString(undefined, { weekday: 'short' })} ${time}`;
  }

  return `${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} ${time}`;
}
