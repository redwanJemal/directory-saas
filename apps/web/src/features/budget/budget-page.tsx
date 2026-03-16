import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BudgetSummary } from './components/budget-summary';
import { BudgetCategoryCard } from './components/budget-category-card';
import { AddBudgetItemDialog } from './components/add-budget-item-dialog';
import { BudgetPieChart } from './components/budget-pie-chart';
import { BudgetBarChart } from './components/budget-bar-chart';
import { useBudget } from './hooks/use-budget';

export function BudgetPage() {
  const { t } = useTranslation();
  const { data: budget, isLoading, error, refetch } = useBudget();
  const [addOpen, setAddOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
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

  const categories = budget?.categories ?? [];
  const pieData = categories.map((cat) => ({
    category: cat.name,
    amount: cat.actual,
  }));
  const barData = categories.map((cat) => ({
    category: cat.name,
    estimated: cat.estimated,
    actual: cat.actual,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t('budget.title')}</h1>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('budget.addItem')}
        </Button>
      </div>

      <BudgetSummary
        totalBudget={budget?.totalBudget ?? 0}
        spent={budget?.spent ?? 0}
      />

      {/* Category cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((category) => (
          <BudgetCategoryCard key={category.id} category={category} />
        ))}
      </div>

      {/* Charts */}
      {categories.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('budget.spendingByCategory')}</CardTitle>
            </CardHeader>
            <CardContent>
              <BudgetPieChart data={pieData} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('budget.estimatedVsActual')}</CardTitle>
            </CardHeader>
            <CardContent>
              <BudgetBarChart data={barData} />
            </CardContent>
          </Card>
        </div>
      )}

      <AddBudgetItemDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        categories={categories}
      />
    </div>
  );
}
