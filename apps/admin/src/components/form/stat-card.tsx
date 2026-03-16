import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: { value: number; label: string };
  variant?: 'default' | 'success' | 'warning' | 'destructive';
}

const trendClasses = {
  positive: 'text-primary',
  negative: 'text-destructive',
};

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold">{value}</span>
          {trend && (
            <span
              className={cn(
                'text-xs font-medium',
                trend.value >= 0
                  ? trendClasses.positive
                  : trendClasses.negative,
              )}
            >
              {trend.value >= 0 ? '+' : ''}
              {trend.value}% {trend.label}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
