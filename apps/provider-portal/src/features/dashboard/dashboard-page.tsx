import { useTranslation } from 'react-i18next';
import { CalendarCheck, Clock, Star, DollarSign } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api';
import { Link } from 'react-router';

interface DashboardStats {
  totalBookings: number;
  pendingInquiries: number;
  averageRating: number;
  revenueThisMonth: number;
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

export function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { data: dashboardStats, isLoading: statsLoading } = useDashboardStats();

  const stats = [
    { titleKey: 'dashboard.totalBookings', value: dashboardStats?.totalBookings ?? '—', icon: CalendarCheck },
    { titleKey: 'dashboard.pendingInquiries', value: dashboardStats?.pendingInquiries ?? '—', icon: Clock },
    { titleKey: 'dashboard.averageRating', value: dashboardStats?.averageRating ?? '—', icon: Star },
    { titleKey: 'dashboard.revenueThisMonth', value: dashboardStats?.revenueThisMonth ?? '—', icon: DollarSign },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground">
          {t('dashboard.welcome', { name: user?.name || 'Provider' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.titleKey}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t(stat.titleKey)}</CardTitle>
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

      {/* Recent sections */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.recentBookings')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{t('common.comingSoon')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.recentReviews')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{t('common.comingSoon')}</p>
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
            <Link to="/profile">{t('dashboard.updateProfile')}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/messages">{t('dashboard.checkMessages')}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/calendar">{t('dashboard.viewCalendar')}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
