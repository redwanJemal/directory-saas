import { useTranslation } from 'react-i18next';
import {
  Mail,
  Bell,
  Download,
  Trash2,
  Search,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useQueueStatsQuery } from './hooks/use-jobs';
import type { QueueStats } from './types';

const queueIcons: Record<string, React.ElementType> = {
  email: Mail,
  notification: Bell,
  export: Download,
  cleanup: Trash2,
  indexing: Search,
  ai: Sparkles,
};

const defaultQueues: QueueStats[] = [
  { name: 'email', pending: 0, active: 0, completed: 0, failed: 0 },
  { name: 'notification', pending: 0, active: 0, completed: 0, failed: 0 },
  { name: 'export', pending: 0, active: 0, completed: 0, failed: 0 },
  { name: 'cleanup', pending: 0, active: 0, completed: 0, failed: 0 },
  { name: 'indexing', pending: 0, active: 0, completed: 0, failed: 0 },
  { name: 'ai', pending: 0, active: 0, completed: 0, failed: 0 },
];

function QueueCard({ stats }: { stats: QueueStats }) {
  const { t } = useTranslation();
  const Icon = queueIcons[stats.name] ?? Sparkles;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base capitalize">{stats.name}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t('jobs.pending')}</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">
              {stats.pending}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t('jobs.active')}</span>
            <span className="font-bold text-green-600 dark:text-green-400">
              {stats.active}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              {t('jobs.completed')}
            </span>
            <span className="font-bold">{stats.completed}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t('jobs.failed')}</span>
            <span className="font-bold text-red-600 dark:text-red-400">
              {stats.failed}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QueueCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-5" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export function JobsPage() {
  const { t } = useTranslation();
  const { data: queues, isLoading } = useQueueStatsQuery();

  const displayQueues = queues ?? defaultQueues;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          {t('jobs.title')}
        </h1>
        <Button variant="outline" asChild>
          <a
            href="/api/v1/admin/queues"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            {t('jobs.viewDashboard')}
          </a>
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        {t('jobs.autoRefreshNote')}
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <QueueCardSkeleton key={i} />
            ))
          : displayQueues.map((stats) => (
              <QueueCard key={stats.name} stats={stats} />
            ))}
      </div>
    </div>
  );
}
