import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';

interface BudgetSummaryProps {
  totalBudget: number;
  spent: number;
}

export function BudgetSummary({ totalBudget, spent }: BudgetSummaryProps) {
  const { t } = useTranslation();
  const remaining = totalBudget - spent;
  const percentage = totalBudget > 0 ? (spent / totalBudget) * 100 : 0;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-muted-foreground">{t('budget.totalBudget')}</p>
            <p className="text-2xl font-bold">{formatCurrency(totalBudget)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('budget.spent')}</p>
            <p className="text-2xl font-bold text-accent-foreground">
              {formatCurrency(spent)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('budget.remaining')}</p>
            <p
              className={cn(
                'text-2xl font-bold',
                remaining >= 0 ? 'text-primary' : 'text-destructive',
              )}
            >
              {formatCurrency(remaining)}
            </p>
          </div>
        </div>
        <Progress value={Math.min(percentage, 100)} className="mt-4" />
      </CardContent>
    </Card>
  );
}
