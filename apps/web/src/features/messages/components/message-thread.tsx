import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ArrowLeft, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import type { Message, Conversation } from '../types';

interface MessageThreadProps {
  conversation: Conversation;
  messages: Message[];
  isLoading?: boolean;
  onBack?: () => void;
}

export function MessageThread({
  conversation,
  messages,
  isLoading,
  onBack,
}: MessageThreadProps) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const bottomRef = useRef<HTMLDivElement>(null);

  const sortedMessages = [...messages].reverse();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 p-3 border-b border-border">
        {onBack && (
          <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
          {conversation.participantName.charAt(0).toUpperCase()}
        </div>
        <span className="font-medium">{conversation.participantName}</span>
      </div>

      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            {t('common.loading')}
          </div>
        ) : sortedMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            {t('messages.noMessages')}
          </div>
        ) : (
          <div className="space-y-3">
            {sortedMessages.map((message) => {
              const isMine = message.senderId === user?.id;
              return (
                <div
                  key={message.id}
                  className={cn('flex', isMine ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cn(
                      'max-w-[75%] rounded-lg px-3 py-2',
                      isMine
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground',
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    {message.attachments?.map((attachment) => (
                      <a
                        key={attachment.id}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          'flex items-center gap-1 text-xs mt-1 hover:underline',
                          isMine ? 'text-primary-foreground/80' : 'text-muted-foreground',
                        )}
                      >
                        <Paperclip className="h-3 w-3" />
                        {attachment.name}
                      </a>
                    ))}
                    <p
                      className={cn(
                        'text-xs mt-1',
                        isMine ? 'text-primary-foreground/60' : 'text-muted-foreground',
                      )}
                    >
                      {format(new Date(message.createdAt), 'p')}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
