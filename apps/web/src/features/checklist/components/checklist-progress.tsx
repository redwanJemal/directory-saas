import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface ChecklistProgressProps {
  done: number;
  total: number;
}

export function ChecklistProgress({ done, total }: ChecklistProgressProps) {
  const { t } = useTranslation();
  const percentage = total > 0 ? (done / total) * 100 : 0;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            {t('checklist.progress', { done, total })}
          </span>
          <span className="text-sm text-muted-foreground">
            {Math.round(percentage)}%
          </span>
        </div>
        <Progress value={percentage} />
      </CardContent>
    </Card>
  );
}
