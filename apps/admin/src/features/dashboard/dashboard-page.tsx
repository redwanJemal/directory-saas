import { useTranslation } from 'react-i18next';
import { Building2, Users, CreditCard, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth-store';

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

export function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const stats: StatCardProps[] = [
    { titleKey: 'dashboard.totalTenants', value: '\u2014', icon: Building2 },
    { titleKey: 'dashboard.activeUsers', value: '\u2014', icon: Users },
    {
      titleKey: 'dashboard.activeSubscriptions',
      value: '\u2014',
      icon: CreditCard,
    },
    { titleKey: 'dashboard.revenue', value: '\u2014', icon: DollarSign },
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.titleKey} {...stat} />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.recentTenants')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t('common.comingSoon')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.systemHealth')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t('common.comingSoon')}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
