import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { format, isPast, isToday } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToggleTask, useDeleteTask } from '../hooks/use-checklist';
import type { ChecklistTask } from '../types';

interface TaskCardProps {
  task: ChecklistTask;
}

export function TaskCard({ task }: TaskCardProps) {
  const { t } = useTranslation();
  const toggleTask = useToggleTask();
  const deleteTask = useDeleteTask();

  const dueDate = new Date(task.dueDate);
  const isOverdue = !task.completed && isPast(dueDate) && !isToday(dueDate);

  function handleToggle() {
    toggleTask.mutate(
      { taskId: task.id, completed: !task.completed },
      { onError: () => toast.error(t('errors.serverError')) },
    );
  }

  function handleDelete() {
    deleteTask.mutate(task.id, {
      onError: () => toast.error(t('errors.serverError')),
    });
  }

  return (
    <Card className={cn(task.completed && 'opacity-60')}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            className="mt-0.5"
            checked={task.completed}
            onCheckedChange={handleToggle}
          />
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                'text-sm font-medium',
                task.completed && 'line-through text-muted-foreground',
              )}
            >
              {task.title}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={cn(
                  'text-xs',
                  isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground',
                )}
              >
                {format(dueDate, 'MMM d, yyyy')}
              </span>
              {task.assignedTo && (
                <span className="text-xs text-muted-foreground">
                  · {task.assignedTo}
                </span>
              )}
              {task.category && (
                <span className="text-xs text-muted-foreground">
                  · {task.category}
                </span>
              )}
            </div>
            {task.description && (
              <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive flex-shrink-0"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
