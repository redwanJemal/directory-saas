import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Store,
  MessageSquare,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import type { ApiPagedResponse } from '@/lib/types';

interface DashboardStats {
  vendorsBooked: number;
}

interface RecentMessage {
  id: string;
  participantName: string;
  lastMessage?: string;
  lastMessageAt?: string;
}

function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const bookings = await api
        .get<ApiPagedResponse<unknown>>('/bookings/me?pageSize=1')
        .catch(() => null);

      const stats: DashboardStats = {
        vendorsBooked: bookings?.data?.pagination?.totalCount ?? 0,
      };
      return stats;
    },
  });
}

function useRecentConversations() {
  return useQuery({
    queryKey: ['conversations', 'recent'],
    queryFn: async () => {
      const { data } = await api.get<ApiPagedResponse<RecentMessage>>(
        '/conversations?sort=-lastMessageAt&pageSize=3',
      );
      return data.data;
    },
  });
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ClientDashboardPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: messages } = useRecentConversations();

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">
        {t('dashboard.welcome', { name: user?.name ?? '' })}
      </h1>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          label={t('dashboard.vendorsBooked')}
          value={stats?.vendorsBooked ?? 0}
          icon={Store}
        />
        <StatCard
          label={t('dashboard.recentMessages')}
          value={messages?.length ?? 0}
          icon={MessageSquare}
        />
      </div>

      {/* Recent messages */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            {t('dashboard.recentMessages')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {messages && messages.length > 0 ? (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary flex-shrink-0">
                    {msg.participantName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{msg.participantName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {msg.lastMessage}
                    </p>
                  </div>
                  {msg.lastMessageAt && (
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {format(new Date(msg.lastMessageAt), 'MMM d')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t('messages.noMessages')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
