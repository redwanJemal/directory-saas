import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { format } from 'date-fns';
import {
  CreditCard,
  Crown,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Receipt,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  usePlansQuery,
  useCurrentSubscriptionQuery,
  usePaymentHistoryQuery,
  useCheckoutMutation,
  useBillingPortalMutation,
} from './hooks/use-subscription';
import type { SubscriptionPlan } from './hooks/use-subscription';

export function SubscriptionPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>(
    'monthly',
  );
  const [paymentPage] = useState(1);

  const { data: plans, isLoading: plansLoading } = usePlansQuery();
  const { data: subscription, isLoading: subLoading } =
    useCurrentSubscriptionQuery();
  const { data: paymentHistory } = usePaymentHistoryQuery(paymentPage);
  const checkoutMutation = useCheckoutMutation();
  const billingPortalMutation = useBillingPortalMutation();

  const success = searchParams.get('success') === 'true';
  const cancelled = searchParams.get('cancelled') === 'true';

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    const result = await checkoutMutation.mutateAsync({
      planId: plan.id,
      interval: billingInterval,
    });
    if (result.url) {
      window.location.href = result.url;
    }
  };

  const handleManageBilling = async () => {
    const result = await billingPortalMutation.mutateAsync();
    if (result.url) {
      window.location.href = result.url;
    }
  };

  const statusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'default';
      case 'past_due':
        return 'destructive';
      case 'cancelled':
        return 'secondary';
      case 'trial':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t('subscription.title')}
        </h1>
        <p className="text-muted-foreground">{t('subscription.subtitle')}</p>
      </div>

      {success && (
        <Card className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
          <CardContent className="flex items-center gap-3 pt-6">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <p className="text-green-800 dark:text-green-200">
              {t('subscription.paymentSuccess')}
            </p>
          </CardContent>
        </Card>
      )}

      {cancelled && (
        <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <p className="text-yellow-800 dark:text-yellow-200">
              {t('subscription.paymentCancelled')}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Current Subscription */}
      {!subLoading && subscription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              {t('subscription.currentPlan')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">
                  {subscription.plan.displayName}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={statusColor(subscription.status)}>
                    {t(`subscription.status.${subscription.status.toLowerCase()}`)}
                  </Badge>
                  {subscription.billingInterval && (
                    <span className="text-sm text-muted-foreground">
                      {t(`subscription.interval.${subscription.billingInterval}`)}
                    </span>
                  )}
                </div>
                {subscription.renewsAt && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {t('subscription.renewsAt', {
                      date: format(
                        new Date(subscription.renewsAt),
                        'MMM d, yyyy',
                      ),
                    })}
                  </p>
                )}
              </div>
              {subscription.stripeCustomerId && (
                <Button
                  variant="outline"
                  onClick={handleManageBilling}
                  disabled={billingPortalMutation.isPending}
                >
                  <ExternalLink className="h-4 w-4 me-2" />
                  {t('subscription.manageBilling')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {t('subscription.availablePlans')}
          </h2>
          <div className="flex items-center gap-1 rounded-lg border p-1">
            <Button
              variant={billingInterval === 'monthly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setBillingInterval('monthly')}
            >
              {t('subscription.monthly')}
            </Button>
            <Button
              variant={billingInterval === 'yearly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setBillingInterval('yearly')}
            >
              {t('subscription.yearly')}
            </Button>
          </div>
        </div>

        {plansLoading ? (
          <div className="text-center text-muted-foreground py-8">
            {t('common.loading')}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {(plans ?? []).map((plan) => {
              const price =
                billingInterval === 'yearly'
                  ? plan.priceYearly
                  : plan.priceMonthly;
              const isCurrentPlan = subscription?.planId === plan.id;

              return (
                <Card
                  key={plan.id}
                  className={
                    isCurrentPlan ? 'border-primary ring-1 ring-primary' : ''
                  }
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {plan.displayName}
                      {isCurrentPlan && (
                        <Badge variant="default">
                          {t('subscription.current')}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <span className="text-3xl font-bold">
                        ${price}
                      </span>
                      <span className="text-muted-foreground">
                        /
                        {billingInterval === 'yearly'
                          ? t('subscription.year')
                          : t('subscription.month')}
                      </span>
                    </div>

                    {plan.description && (
                      <p className="text-sm text-muted-foreground">
                        {plan.description}
                      </p>
                    )}

                    <ul className="space-y-2 text-sm">
                      {(plan.features as string[]).map((feature) => (
                        <li key={feature} className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                          {feature}
                        </li>
                      ))}
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        {plan.maxUsers === -1
                          ? t('subscription.unlimitedUsers')
                          : t('subscription.maxUsers', {
                              count: plan.maxUsers,
                            })}
                      </li>
                    </ul>

                    <Button
                      className="w-full"
                      variant={isCurrentPlan ? 'outline' : 'default'}
                      disabled={isCurrentPlan || checkoutMutation.isPending}
                      onClick={() => handleSelectPlan(plan)}
                    >
                      {isCurrentPlan
                        ? t('subscription.currentPlan')
                        : price === 0
                          ? t('subscription.getStarted')
                          : t('subscription.upgrade')}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment History */}
      {paymentHistory &&
        paymentHistory.data &&
        paymentHistory.data.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                {t('subscription.paymentHistory')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('subscription.date')}</TableHead>
                    <TableHead>{t('subscription.description')}</TableHead>
                    <TableHead>{t('subscription.amount')}</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentHistory.data.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        {payment.paidAt
                          ? format(new Date(payment.paidAt), 'MMM d, yyyy')
                          : format(
                              new Date(payment.createdAt),
                              'MMM d, yyyy',
                            )}
                      </TableCell>
                      <TableCell>{payment.description ?? '—'}</TableCell>
                      <TableCell>
                        <span className="font-medium">
                          ${payment.amount.toFixed(2)}{' '}
                          {payment.currency}
                        </span>
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
