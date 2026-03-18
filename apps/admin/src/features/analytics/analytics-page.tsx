import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Building2,
  Users,
  TrendingUp,
  TrendingDown,
  Star,
  MousePointerClick,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useAdminAnalytics } from './hooks/use-admin-analytics';

const PERIOD_OPTIONS = [
  { label: 'analytics.period_7d', days: 7 },
  { label: 'analytics.period_30d', days: 30 },
  { label: 'analytics.period_90d', days: 90 },
] as const;

function SimpleBarChart({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="space-y-2">
      {data.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="w-24 text-sm text-muted-foreground truncate">
            {item.label}
          </span>
          <div className="flex-1 h-6 bg-muted rounded-md overflow-hidden">
            <div
              className="h-full bg-primary rounded-md transition-all"
              style={{ width: `${(item.value / maxValue) * 100}%` }}
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

export function AnalyticsPage() {
  const { t } = useTranslation();
  const [days, setDays] = useState(30);
  const { data, isLoading } = useAdminAnalytics(days);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">
          {t('analytics.title')}
        </h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const stats = data?.stats;

  const statCards = [
    {
      titleKey: 'analytics.totalBusinesses',
      value: stats?.totalBusinesses ?? 0,
      icon: Building2,
    },
    {
      titleKey: 'analytics.newBusinesses',
      value: stats?.newBusinesses ?? 0,
      trend: stats?.newBusinessesTrend,
      icon: TrendingUp,
    },
    {
      titleKey: 'analytics.totalUsers',
      value: stats?.totalClients ?? 0,
      icon: Users,
    },
    {
      titleKey: 'analytics.newUsers',
      value: stats?.newClients ?? 0,
      trend: stats?.newClientsTrend,
      icon: Users,
    },
    {
      titleKey: 'analytics.totalReviews',
      value: stats?.totalReviews ?? 0,
      icon: Star,
    },
    {
      titleKey: 'analytics.verifiedBusinesses',
      value: stats?.verifiedBusinesses ?? 0,
      icon: ShieldCheck,
    },
    {
      titleKey: 'analytics.pendingVerifications',
      value: stats?.pendingVerifications ?? 0,
      icon: Clock,
    },
    {
      titleKey: 'analytics.contactClicks',
      value: stats?.contactClicks ?? 0,
      icon: MousePointerClick,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          {t('analytics.title')}
        </h1>
        <Tabs
          value={String(days)}
          onValueChange={(v) => setDays(Number(v))}
        >
          <TabsList>
            {PERIOD_OPTIONS.map((p) => (
              <TabsTrigger key={p.days} value={String(p.days)}>
                {t(p.label)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.titleKey}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t(stat.titleKey)}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">
                  {stat.value.toLocaleString()}
                </span>
                {stat.trend !== undefined && stat.trend !== 0 && (
                  <span
                    className={cn(
                      'flex items-center text-xs font-medium',
                      stat.trend >= 0 ? 'text-primary' : 'text-destructive',
                    )}
                  >
                    {stat.trend >= 0 ? (
                      <TrendingUp className="h-3 w-3 mr-0.5" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-0.5" />
                    )}
                    {Math.abs(stat.trend)}%
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Growth charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('analytics.businessGrowth')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data?.businessGrowthChart ?? []}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis
                  dataKey="date"
                  className="text-muted-foreground"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => v.slice(5)}
                />
                <YAxis
                  className="text-muted-foreground"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    borderColor: 'var(--color-border)',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('analytics.userGrowth')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.userGrowthChart ?? []}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis
                  dataKey="date"
                  className="text-muted-foreground"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => v.slice(5)}
                />
                <YAxis
                  className="text-muted-foreground"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    borderColor: 'var(--color-border)',
                    borderRadius: '8px',
                  }}
                />
                <Bar
                  dataKey="value"
                  fill="var(--color-primary)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Categories, geography, top businesses */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Businesses by country */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('analytics.businessesByCountry')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.businessesByCountry &&
            Object.keys(data.businessesByCountry).length > 0 ? (
              <SimpleBarChart
                data={Object.entries(data.businessesByCountry)
                  .sort(([, a], [, b]) => b - a)
                  .map(([label, value]) => ({ label, value }))}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                {t('dashboard.noData')}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Top categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('analytics.topCategories')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.topCategories && data.topCategories.length > 0 ? (
              <SimpleBarChart
                data={data.topCategories.map((c) => ({
                  label: c.name,
                  value: c.count,
                }))}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                {t('dashboard.noData')}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Top businesses by clicks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('analytics.topBusinessesByClicks')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.topBusinessesByClicks &&
            data.topBusinessesByClicks.length > 0 ? (
              <SimpleBarChart
                data={data.topBusinessesByClicks.map((b) => ({
                  label: b.name,
                  value: b.clicks,
                }))}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                {t('dashboard.noData')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Verification conversion */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t('analytics.verificationConversion')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('analytics.totalRequests')}
              </p>
              <span className="text-2xl font-bold mt-1 block">
                {(stats?.verifiedBusinesses ?? 0) +
                  (stats?.pendingVerifications ?? 0)}
              </span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t('analytics.approved')}
              </p>
              <span className="text-2xl font-bold mt-1 block">
                {stats?.verifiedBusinesses ?? 0}
              </span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t('analytics.pendingVerifications')}
              </p>
              <span className="text-2xl font-bold mt-1 block">
                {stats?.pendingVerifications ?? 0}
              </span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t('analytics.conversionRate')}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold">
                  {stats?.verificationRate ?? 0}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
