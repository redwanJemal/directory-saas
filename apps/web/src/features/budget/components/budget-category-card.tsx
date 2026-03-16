import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/format';
import { useDeleteBudgetItem } from '../hooks/use-budget';
import type { BudgetCategory } from '../types';

interface BudgetCategoryCardProps {
  category: BudgetCategory;
}

export function BudgetCategoryCard({ category }: BudgetCategoryCardProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const deleteItem = useDeleteBudgetItem();
  const percentage =
    category.estimated > 0 ? (category.actual / category.estimated) * 100 : 0;

  return (
    <Card>
      <CardHeader
        className="cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{category.name}</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {formatCurrency(category.actual)} / {formatCurrency(category.estimated)}
            </span>
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </div>
        <Progress value={Math.min(percentage, 100)} className="mt-2" />
      </CardHeader>

      {expanded && (
        <CardContent>
          {category.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('common.noResults')}</p>
          ) : (
            <div className="space-y-2">
              {category.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-b-0"
                >
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    {item.vendor && (
                      <p className="text-xs text-muted-foreground">{item.vendor}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm">
                        {formatCurrency(item.actual)} / {formatCurrency(item.estimated)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('budget.paid')}: {formatCurrency(item.paid)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() =>
                        deleteItem.mutate(item.id, {
                          onError: () => toast.error(t('errors.serverError')),
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
