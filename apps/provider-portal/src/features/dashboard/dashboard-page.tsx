import { useTranslation } from 'react-i18next';
import { CalendarCheck, Clock, Star, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { Link } from 'react-router';

export function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const stats = [
    { titleKey: 'dashboard.totalBookings', value: '—', icon: CalendarCheck },
    { titleKey: 'dashboard.pendingInquiries', value: '—', icon: Clock },
    { titleKey: 'dashboard.averageRating', value: '—', icon: Star },
    { titleKey: 'dashboard.revenueThisMonth', value: '—', icon: DollarSign },
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
              <div className="text-2xl font-bold">{stat.value}</div>
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
