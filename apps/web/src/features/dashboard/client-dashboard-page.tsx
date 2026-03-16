import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { differenceInDays, format } from 'date-fns';
import {
  Store,
  Users,
  DollarSign,
  CheckSquare,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { useAuthStore } from '@/stores/auth-store';
import type { ApiResponse, ApiPagedResponse } from '@/lib/types';

interface WeddingOverview {
  id: string;
  title: string;
  date: string;
  venue?: string;
  guestCount?: number;
}

interface DashboardStats {
  vendorsBooked: number;
  guestsConfirmed: number;
  guestsTotal: number;
  budgetSpent: number;
  budgetTotal: number;
  tasksDone: number;
  tasksTotal: number;
}

interface ChecklistItem {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
  category?: string;
}

interface RecentMessage {
  id: string;
  participantName: string;
  lastMessage?: string;
  lastMessageAt?: string;
}

function useWeddingOverview() {
  return useQuery({
    queryKey: ['wedding', 'me'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<WeddingOverview>>('/weddings/me');
      return data.data;
    },
  });
}

function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const [bookings, guests, budget, checklist] = await Promise.all([
        api.get<ApiPagedResponse<unknown>>('/bookings/me?pageSize=1').catch(() => null),
        api.get<ApiPagedResponse<{ rsvp: string }>>('/weddings/me/guests?pageSize=1').catch(() => null),
        api.get<ApiResponse<{ totalBudget: number; spent: number }>>('/weddings/me/budget').catch(() => null),
        api.get<ApiPagedResponse<{ completed: boolean }>>('/weddings/me/checklist?pageSize=1').catch(() => null),
      ]);

      const stats: DashboardStats = {
        vendorsBooked: bookings?.data?.pagination?.totalCount ?? 0,
        guestsConfirmed: 0,
        guestsTotal: guests?.data?.pagination?.totalCount ?? 0,
        budgetSpent: budget?.data?.data?.spent ?? 0,
        budgetTotal: budget?.data?.data?.totalBudget ?? 0,
        tasksDone: 0,
        tasksTotal: checklist?.data?.pagination?.totalCount ?? 0,
      };
      return stats;
    },
  });
}

function useUpcomingTasks() {
  return useQuery({
    queryKey: ['checklist', 'upcoming'],
    queryFn: async () => {
      const { data } = await api.get<ApiPagedResponse<ChecklistItem>>(
        '/weddings/me/checklist?filter[completed]=false&sort=dueDate&pageSize=5',
      );
      return data.data;
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

function CountdownCard({ weddingDate }: { weddingDate: string }) {
  const { t } = useTranslation();
  const daysLeft = differenceInDays(new Date(weddingDate), new Date());

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
      <CardContent className="p-6 text-center">
        <div className="text-5xl font-bold text-primary">{Math.max(0, daysLeft)}</div>
        <p className="text-muted-foreground mt-1">
          {t('dashboard.countdown', { days: Math.max(0, daysLeft) })}
        </p>
      </CardContent>
    </Card>
  );
}

function StatCard({
  label,
  value,
  subValue,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  subValue?: string;
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
            {subValue && (
              <p className="text-xs text-muted-foreground">{subValue}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ClientDashboardPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { data: wedding, isLoading: weddingLoading } = useWeddingOverview();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: tasks } = useUpcomingTasks();
  const { data: messages } = useRecentConversations();

  if (weddingLoading || statsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  const budgetPercent =
    stats && stats.budgetTotal > 0
      ? Math.round((stats.budgetSpent / stats.budgetTotal) * 100)
      : 0;
  const tasksPercent =
    stats && stats.tasksTotal > 0
      ? Math.round((stats.tasksDone / stats.tasksTotal) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">
        {t('dashboard.welcome', { name: user?.name ?? '' })}
      </h1>

      {/* Wedding overview + countdown */}
      {wedding?.date && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">{t('dashboard.weddingOverview')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('wedding.title')}</p>
                  <p className="font-medium">{wedding.title}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('wedding.weddingDate')}</p>
                  <p className="font-medium">{format(new Date(wedding.date), 'PPP')}</p>
                </div>
                {wedding.venue && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t('wedding.venue')}</p>
                    <p className="font-medium">{wedding.venue}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          <CountdownCard weddingDate={wedding.date} />
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label={t('dashboard.vendorsBooked')}
          value={stats?.vendorsBooked ?? 0}
          icon={Store}
        />
        <StatCard
          label={t('dashboard.guestsConfirmed')}
          value={`${stats?.guestsConfirmed ?? 0} / ${stats?.guestsTotal ?? 0}`}
          icon={Users}
        />
        <StatCard
          label={t('dashboard.budgetSpent')}
          value={formatCurrency(stats?.budgetSpent ?? 0)}
          subValue={`${budgetPercent}%`}
          icon={DollarSign}
        />
        <StatCard
          label={t('dashboard.tasksDone')}
          value={`${stats?.tasksDone ?? 0} / ${stats?.tasksTotal ?? 0}`}
          subValue={`${tasksPercent}%`}
          icon={CheckSquare}
        />
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upcoming tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {t('dashboard.upcomingTasks')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tasks && tasks.length > 0 ? (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-3">
                    <Checkbox className="mt-0.5" checked={task.completed} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(task.dueDate), 'MMM d, yyyy')}
                        {task.category && ` · ${task.category}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('common.noResults')}</p>
            )}
          </CardContent>
        </Card>

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
    </div>
  );
}
