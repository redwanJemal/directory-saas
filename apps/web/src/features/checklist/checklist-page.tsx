import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { format, isPast, isToday } from 'date-fns';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChecklistProgress } from './components/checklist-progress';
import { TaskCard } from './components/task-card';
import { AddTaskDialog } from './components/add-task-dialog';
import { useChecklist } from './hooks/use-checklist';
import type { ChecklistTask } from './types';

type FilterTab = 'all' | 'overdue' | 'upcoming' | 'completed';

export function ChecklistPage() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<FilterTab>('all');
  const [addOpen, setAddOpen] = useState(false);

  const { data: tasks, isLoading, error, refetch } = useChecklist({ filter });

  const allTasks = tasks ?? [];
  const completedCount = allTasks.filter((t) => t.completed).length;
  const overdueCount = allTasks.filter(
    (t) => !t.completed && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)),
  ).length;

  const filteredTasks = useMemo(() => {
    switch (filter) {
      case 'overdue':
        return allTasks.filter(
          (t) => !t.completed && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)),
        );
      case 'upcoming':
        return allTasks.filter(
          (t) => !t.completed && (!isPast(new Date(t.dueDate)) || isToday(new Date(t.dueDate))),
        );
      case 'completed':
        return allTasks.filter((t) => t.completed);
      default:
        return allTasks;
    }
  }, [allTasks, filter]);

  // Group tasks by month
  const groupedTasks = useMemo(() => {
    const groups: Record<string, ChecklistTask[]> = {};
    filteredTasks.forEach((task) => {
      const monthKey = format(new Date(task.dueDate), 'MMMM yyyy');
      if (!groups[monthKey]) groups[monthKey] = [];
      groups[monthKey].push(task);
    });
    return groups;
  }, [filteredTasks]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-16" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center space-y-4">
        <p className="text-destructive">{t('common.errorOccurred')}</p>
        <Button variant="outline" onClick={() => refetch()}>
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t('checklist.title')}</h1>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('checklist.addTask')}
        </Button>
      </div>

      <ChecklistProgress done={completedCount} total={allTasks.length} />

      <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterTab)}>
        <TabsList>
          <TabsTrigger value="all">{t('checklist.all')}</TabsTrigger>
          <TabsTrigger value="overdue" className="gap-1">
            {t('checklist.overdue')}
            {overdueCount > 0 && (
              <Badge variant="destructive" className="h-5 min-w-5 rounded-full px-1.5 text-xs">
                {overdueCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="upcoming">{t('checklist.upcoming')}</TabsTrigger>
          <TabsTrigger value="completed">{t('checklist.completed')}</TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredTasks.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          {t('common.noResults')}
        </p>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTasks).map(([month, monthTasks]) => (
            <div key={month}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                {month}
              </h3>
              <div className="space-y-2">
                {monthTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <AddTaskDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
