import { useTranslation } from 'react-i18next';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface BudgetBarChartProps {
  data: Array<{ category: string; estimated: number; actual: number }>;
}

export function BudgetBarChart({ data }: BudgetBarChartProps) {
  const { t } = useTranslation();

  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="category" fontSize={12} />
        <YAxis fontSize={12} />
        <Tooltip />
        <Legend />
        <Bar
          dataKey="estimated"
          fill="var(--chart-1)"
          name={t('budget.estimated')}
        />
        <Bar
          dataKey="actual"
          fill="var(--chart-2)"
          name={t('budget.actual')}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
