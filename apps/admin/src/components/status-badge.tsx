import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusStyles: Record<string, string> = {
  active:
    'bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary',
  suspended:
    'bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/20 dark:text-destructive',
  cancelled:
    'bg-muted text-muted-foreground border-muted dark:bg-muted dark:text-muted-foreground',
  pending:
    'bg-accent text-accent-foreground border-accent dark:bg-accent dark:text-accent-foreground',
};

interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium capitalize',
        statusStyles[status] ?? '',
        className,
      )}
    >
      {label ?? status}
    </Badge>
  );
}
