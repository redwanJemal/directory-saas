import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { useConversations, useMessages, useSendMessage } from './hooks/use-messages';
import { ConversationList } from './components/conversation-list';
import { MessageThread } from './components/message-thread';
import { MessageInput } from './components/message-input';
import type { Conversation } from './types';

export function MessagesPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [showThread, setShowThread] = useState(false);

  const { data: conversationsData, isLoading: convLoading } = useConversations(search);
  const { data: messagesData, isLoading: msgLoading } = useMessages(activeConversation?.id ?? null);
  const sendMessage = useSendMessage();

  function handleSelectConversation(conversation: Conversation) {
    setActiveConversation(conversation);
    setShowThread(true);
  }

  async function handleSend(text: string, attachments?: File[]) {
    if (!activeConversation) return;

    try {
      await sendMessage.mutateAsync({
        conversationId: activeConversation.id,
        text,
        attachments,
      });
    } catch {
      toast.error(t('errors.serverError'));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('messages.title')}</h1>
      </div>

      <Card className="overflow-hidden">
        <div className="flex h-[calc(100vh-220px)] min-h-[500px]">
          {/* Conversation list */}
          <div className={`w-full md:w-1/3 md:block ${showThread ? 'hidden' : 'block'}`}>
            <ConversationList
              conversations={conversationsData?.data ?? []}
              activeId={activeConversation?.id ?? null}
              onSelect={handleSelectConversation}
              search={search}
              onSearchChange={setSearch}
              isLoading={convLoading}
            />
          </div>

          {/* Message thread */}
          <div className={`w-full md:w-2/3 flex flex-col ${showThread ? 'block' : 'hidden md:block'}`}>
            {activeConversation ? (
              <>
                <MessageThread
                  conversation={activeConversation}
                  messages={messagesData?.data ?? []}
                  isLoading={msgLoading}
                  onBack={() => setShowThread(false)}
                />
                <MessageInput
                  onSend={handleSend}
                  disabled={sendMessage.isPending}
                />
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                {t('messages.selectConversation')}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
