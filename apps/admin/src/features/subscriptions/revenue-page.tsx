import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { DollarSign, Users, TrendingUp, CreditCard } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useRevenueStatsQuery } from './hooks/use-revenue';

export function RevenuePage() {
  const { t } = useTranslation();
  const { data: stats, isLoading } = useRevenueStatsQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t('revenue.title')}
        </h1>
        <p className="text-muted-foreground">{t('revenue.subtitle')}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t('revenue.totalRevenue')}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats?.totalRevenue?.toFixed(2) ?? '0.00'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t('revenue.monthlyRevenue')}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats?.monthlyRevenue?.toFixed(2) ?? '0.00'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t('revenue.activeSubscriptions')}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.activeSubscriptions ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions by Plan */}
      {stats?.subscriptionsByPlan && stats.subscriptionsByPlan.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {t('revenue.byPlan')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              {stats.subscriptionsByPlan.map((item) => (
                <div
                  key={item.planId}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <span className="font-medium">{item.planName}</span>
                  <Badge variant="secondary">
                    {item.count} {t('revenue.subscribers')}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Payments */}
      <Card>
        <CardHeader>
          <CardTitle>{t('revenue.recentPayments')}</CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.recentPayments && stats.recentPayments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('revenue.business')}</TableHead>
                  <TableHead>{t('revenue.plan')}</TableHead>
                  <TableHead>{t('revenue.amount')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                  <TableHead>{t('revenue.date')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {payment.tenant.name}
                    </TableCell>
                    <TableCell>{payment.plan.displayName}</TableCell>
                    <TableCell>
                      ${payment.amount.toFixed(2)} {payment.currency}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          payment.status === 'succeeded'
                            ? 'default'
                            : payment.status === 'failed'
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {payment.paidAt
                        ? format(new Date(payment.paidAt), 'MMM d, yyyy')
                        : format(new Date(payment.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="py-8 text-center text-muted-foreground">
              {t('revenue.noPayments')}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
