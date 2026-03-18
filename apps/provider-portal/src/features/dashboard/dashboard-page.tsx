import { useTranslation } from 'react-i18next';
import {
  Eye,
  MousePointerClick,
  Star,
  Tags,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api';
import { Link } from 'react-router';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

interface DashboardStats {
  totalBookings: number;
  pendingInquiries: number;
  averageRating: number;
  revenueThisMonth: number;
  profileViews?: number;
  contactClicks?: number;
  reviewCount?: number;
  activeDeals?: number;
}

interface ContactStats {
  period: string;
  total: number;
  byType: Record<string, number>;
}

interface DailyContactStats {
  period: string;
  daily: Array<{
    date: string;
    total: number;
    byType: Record<string, number>;
  }>;
}

function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ['provider', 'dashboard', 'stats'],
    queryFn: async () => {
      const response = await api.get('/providers/dashboard/stats');
      return response.data?.data ?? response.data;
    },
  });
}

function useContactStats(days = 30) {
  return useQuery<ContactStats>({
    queryKey: ['provider', 'contact-stats', days],
    queryFn: async () => {
      const response = await api.get(`/providers/me/contact-stats?days=${days}`);
      return response.data?.data ?? response.data;
    },
  });
}

function useDailyContactStats(days = 30) {
  return useQuery<DailyContactStats>({
    queryKey: ['provider', 'contact-stats', 'daily', days],
    queryFn: async () => {
      const response = await api.get(`/providers/me/contact-stats/daily?days=${days}`);
      return response.data?.data ?? response.data;
    },
  });
}

function useContactStatsLastWeek() {
  return useQuery<ContactStats>({
    queryKey: ['provider', 'contact-stats', 7],
    queryFn: async () => {
      const response = await api.get('/providers/me/contact-stats?days=7');
      return response.data?.data ?? response.data;
    },
  });
}

function useContactStatsPrevWeek() {
  return useQuery<ContactStats>({
    queryKey: ['provider', 'contact-stats', 14],
    queryFn: async () => {
      const response = await api.get('/providers/me/contact-stats?days=14');
      return response.data?.data ?? response.data;
    },
  });
}

export function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { data: dashboardStats, isLoading: statsLoading } = useDashboardStats();
  const { data: contactStats } = useContactStats(30);
  const { data: dailyStats } = useDailyContactStats(30);
  const { data: thisWeekStats } = useContactStatsLastWeek();
  const { data: prevPeriodStats } = useContactStatsPrevWeek();

  // Calculate week-over-week trend
  const thisWeekTotal = thisWeekStats?.total ?? 0;
  const prevWeekTotal = prevPeriodStats
    ? (prevPeriodStats.total ?? 0) - thisWeekTotal
    : 0;
  const trendUp = thisWeekTotal >= prevWeekTotal;
  const trendPercent =
    prevWeekTotal > 0
      ? Math.round(((thisWeekTotal - prevWeekTotal) / prevWeekTotal) * 100)
      : thisWeekTotal > 0
        ? 100
        : 0;

  // Most popular contact method
  const popularMethod = contactStats?.byType
    ? Object.entries(contactStats.byType).sort((a, b) => b[1] - a[1])[0]
    : null;

  // Chart data
  const chartData = dailyStats?.daily?.map((d) => ({
    date: d.date.slice(5),
    whatsapp: d.byType['whatsapp'] ?? 0,
    phone: d.byType['phone'] ?? 0,
    email: d.byType['email'] ?? 0,
  })) ?? [];

  const stats = [
    {
      titleKey: 'dashboard.profileViews',
      value: dashboardStats?.profileViews ?? '—',
      icon: Eye,
    },
    {
      titleKey: 'dashboard.contactClicks',
      value: contactStats?.total ?? '—',
      icon: MousePointerClick,
    },
    {
      titleKey: 'dashboard.reviewCount',
      value: dashboardStats?.reviewCount ?? dashboardStats?.averageRating ?? '—',
      icon: Star,
    },
    {
      titleKey: 'dashboard.activeDeals',
      value: dashboardStats?.activeDeals ?? '—',
      icon: Tags,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground">
          {t('dashboard.welcomeBusiness', {
            name: user?.name || t('dashboard.defaultBusiness'),
          })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.titleKey}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t(stat.titleKey)}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stat.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Contact Analytics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">
              {t('dashboard.contactClicksChart')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      borderColor: 'var(--color-border)',
                      borderRadius: '0.5rem',
                    }}
                  />
                  <Bar
                    dataKey="whatsapp"
                    name="WhatsApp"
                    fill="var(--color-chart-1)"
                    radius={[2, 2, 0, 0]}
                    stackId="stack"
                  />
                  <Bar
                    dataKey="phone"
                    name={t('profile.phone')}
                    fill="var(--color-chart-2)"
                    radius={[2, 2, 0, 0]}
                    stackId="stack"
                  />
                  <Bar
                    dataKey="email"
                    name={t('auth.email')}
                    fill="var(--color-chart-3)"
                    radius={[2, 2, 0, 0]}
                    stackId="stack"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                {t('dashboard.noContactData')}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('dashboard.contactInsights')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('dashboard.thisWeek')}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold">{thisWeekTotal}</span>
                {trendPercent !== 0 && (
                  <span
                    className={`flex items-center text-sm ${trendUp ? 'text-primary' : 'text-destructive'}`}
                  >
                    {trendUp ? (
                      <TrendingUp className="h-4 w-4 mr-0.5" />
                    ) : (
                      <TrendingDown className="h-4 w-4 mr-0.5" />
                    )}
                    {Math.abs(trendPercent)}%
                  </span>
                )}
              </div>
            </div>

            {popularMethod && (
              <div>
                <p className="text-sm text-muted-foreground">
                  {t('dashboard.popularMethod')}
                </p>
                <p className="text-lg font-semibold capitalize mt-1">
                  {popularMethod[0]}
                </p>
                <p className="text-sm text-muted-foreground">
                  {popularMethod[1]} {t('dashboard.clicks')}
                </p>
              </div>
            )}

            {contactStats?.byType && (
              <div className="space-y-2 pt-2 border-t border-border">
                {Object.entries(contactStats.byType).map(([type, count]) => (
                  <div
                    key={type}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="capitalize">{type}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.quickActions')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link to="/profile">{t('dashboard.editProfile')}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/deals">{t('dashboard.addDeal')}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/portfolio">{t('dashboard.viewListing')}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/messages">{t('dashboard.checkMessages')}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
