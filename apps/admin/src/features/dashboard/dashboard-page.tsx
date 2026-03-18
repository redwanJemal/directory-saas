import { useTranslation } from 'react-i18next';
import {
  Building2,
  ShieldCheck,
  TrendingUp,
  Star,
  Clock,
  MousePointerClick,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth-store';
import {
  useDashboardStatsQuery,
  useBusinessesOverTimeQuery,
  useContactClicksByTypeQuery,
} from './hooks/use-dashboard';

interface StatCardProps {
  titleKey: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
}

function StatCard({ titleKey, value, icon: Icon }: StatCardProps) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{t(titleKey)}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function SimpleBarChart({
  data,
}: {
  data: { label: string; value: number; color?: string }[];
}) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="space-y-2">
      {data.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="w-20 text-sm text-muted-foreground truncate">
            {item.label}
          </span>
          <div className="flex-1 h-6 bg-muted rounded-md overflow-hidden">
            <div
              className="h-full bg-primary rounded-md transition-all"
              style={{
                width: `${(item.value / maxValue) * 100}%`,
              }}
            />
          </div>
          <span className="w-10 text-sm font-medium text-right">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function BusinessesOverTimeChart() {
  const { t } = useTranslation();
  const { data } = useBusinessesOverTimeQuery(30);

  if (!data?.daily?.length) {
    return (
      <p className="text-sm text-muted-foreground">
        {t('dashboard.noData')}
      </p>
    );
  }

  // Aggregate by country across all days
  const countryTotals: Record<string, number> = {};
  for (const day of data.daily) {
    for (const [country, count] of Object.entries(day.byCountry)) {
      countryTotals[country] = (countryTotals[country] || 0) + count;
    }
  }

  const chartData = Object.entries(countryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([label, value]) => ({ label, value }));

  return <SimpleBarChart data={chartData} />;
}

function ContactClicksChart() {
  const { t } = useTranslation();
  const { data } = useContactClicksByTypeQuery(30);

  if (!data?.byType || Object.keys(data.byType).length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t('dashboard.noData')}
      </p>
    );
  }

  const chartData = Object.entries(data.byType)
    .sort(([, a], [, b]) => b - a)
    .map(([label, value]) => ({ label, value }));

  return <SimpleBarChart data={chartData} />;
}

export function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { data: stats } = useDashboardStatsQuery();

  const statCards: StatCardProps[] = [
    {
      titleKey: 'dashboard.totalBusinesses',
      value: stats?.totalBusinesses ?? '—',
      icon: Building2,
    },
    {
      titleKey: 'dashboard.pendingVerifications',
      value: stats?.pendingVerifications ?? '—',
      icon: Clock,
    },
    {
      titleKey: 'dashboard.newThisWeek',
      value: stats?.newThisWeek ?? '—',
      icon: TrendingUp,
    },
    {
      titleKey: 'dashboard.totalReviews',
      value: stats?.totalReviews ?? '—',
      icon: Star,
    },
    {
      titleKey: 'dashboard.verifiedBusinesses',
      value: stats?.verifiedBusinesses ?? '—',
      icon: ShieldCheck,
    },
    {
      titleKey: 'dashboard.contactClicks',
      value: stats?.totalContactClicks ?? '—',
      icon: MousePointerClick,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t('dashboard.title')}
        </h1>
        <p className="text-muted-foreground">
          {t('dashboard.welcome', { name: user?.name || 'Admin' })}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <StatCard key={stat.titleKey} {...stat} />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.businessesByCountry')}</CardTitle>
          </CardHeader>
          <CardContent>
            <BusinessesOverTimeChart />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.contactClicksByType')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ContactClicksChart />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
