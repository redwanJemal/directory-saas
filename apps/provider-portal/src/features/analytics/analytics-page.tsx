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
import { TrendingUp, TrendingDown, Eye, MessageSquare, CalendarCheck, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useAnalytics } from './hooks/use-analytics';

const PERIODS = ['7d', '30d', '90d', '12m'] as const;

export function AnalyticsPage() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<string>('30d');
  const { data, isLoading } = useAnalytics(period);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">{t('analytics.title')}</h1>
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
      label: t('analytics.profileViews'),
      value: stats?.profileViews?.toLocaleString() ?? '0',
      trend: stats?.profileViewsTrend ?? 0,
      icon: Eye,
    },
    {
      label: t('analytics.inquiries'),
      value: stats?.inquiries?.toLocaleString() ?? '0',
      trend: stats?.inquiriesTrend ?? 0,
      icon: MessageSquare,
    },
    {
      label: t('analytics.bookingRate'),
      value: `${stats?.bookingRate ?? 0}%`,
      trend: stats?.bookingRateTrend ?? 0,
      icon: CalendarCheck,
    },
    {
      label: t('analytics.revenue'),
      value: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'ETB',
        maximumFractionDigits: 0,
      }).format(stats?.revenue ?? 0),
      trend: stats?.revenueTrend ?? 0,
      icon: DollarSign,
    },
  ];

  const funnel = data?.conversionFunnel;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t('analytics.title')}</h1>
        <Tabs value={period} onValueChange={setPeriod}>
          <TabsList>
            {PERIODS.map((p) => (
              <TabsTrigger key={p} value={p}>
                {t(`analytics.period_${p}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold">{stat.value}</span>
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
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('analytics.profileViews')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data?.profileViewsChart ?? []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="date"
                  className="text-muted-foreground"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => v.slice(5)}
                />
                <YAxis className="text-muted-foreground" tick={{ fontSize: 12 }} />
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
            <CardTitle className="text-base">{t('analytics.inquiryTrend')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.inquiriesChart ?? []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="date"
                  className="text-muted-foreground"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => v.slice(5)}
                />
                <YAxis className="text-muted-foreground" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    borderColor: 'var(--color-border)',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="value" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('analytics.conversionFunnel')}</CardTitle>
          </CardHeader>
          <CardContent>
            {funnel && (
              <div className="space-y-3">
                {[
                  { label: t('analytics.profileViews'), value: funnel.views },
                  { label: t('analytics.inquiries'), value: funnel.inquiries },
                  { label: t('analytics.quotesSent'), value: funnel.quotes },
                  { label: t('analytics.bookingsConfirmed'), value: funnel.bookings },
                ].map((step, i) => {
                  const percentage = funnel.views > 0
                    ? Math.round((step.value / funnel.views) * 100)
                    : 0;
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{step.label}</span>
                        <span className="font-medium">
                          {step.value.toLocaleString()} ({percentage}%)
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('analytics.revenue')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.revenueChart ?? []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="date"
                  className="text-muted-foreground"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => v.slice(5)}
                />
                <YAxis className="text-muted-foreground" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    borderColor: 'var(--color-border)',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="value" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      {/* Review Stats & Contact Clicks */}
      <div className="grid gap-4 md:grid-cols-2">
        {data?.reviewStats && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('analytics.reviewStats')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('analytics.averageRating')}</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold">{data.reviewStats.averageRating}</span>
                    <span className="text-sm text-muted-foreground">/ 5</span>
                    {data.reviewStats.ratingTrend !== 0 && (
                      <span
                        className={cn(
                          'flex items-center text-xs font-medium',
                          data.reviewStats.ratingTrend >= 0 ? 'text-primary' : 'text-destructive',
                        )}
                      >
                        {data.reviewStats.ratingTrend >= 0 ? (
                          <TrendingUp className="h-3 w-3 mr-0.5" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-0.5" />
                        )}
                        {Math.abs(data.reviewStats.ratingTrend)}%
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('analytics.totalReviews')}</p>
                  <span className="text-2xl font-bold mt-1 block">{data.reviewStats.totalReviews}</span>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">{t('analytics.responseRate')}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${data.reviewStats.responseRate}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{data.reviewStats.responseRate}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {data?.contactClicksByType && Object.keys(data.contactClicksByType).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('analytics.contactClicks')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(data.contactClicksByType)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => {
                    const maxCount = Math.max(
                      ...Object.values(data.contactClicksByType!),
                    );
                    const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
                    return (
                      <div key={type} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="capitalize">{type}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
