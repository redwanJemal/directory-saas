import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useSubscriptionPlansQuery,
  useChangePlanMutation,
} from '../hooks/use-subscriptions';
import type { Subscription } from '../types';

interface ChangePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: Subscription | null;
}

export function ChangePlanDialog({
  open,
  onOpenChange,
  subscription,
}: ChangePlanDialogProps) {
  const { t } = useTranslation();
  const { data: plans } = useSubscriptionPlansQuery();
  const changePlanMutation = useChangePlanMutation();

  const [selectedPlanId, setSelectedPlanId] = useState('');

  useEffect(() => {
    if (open && subscription) {
      setSelectedPlanId(subscription.planId);
    }
  }, [open, subscription]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subscription || !selectedPlanId) return;
    changePlanMutation.mutate(
      { subscriptionId: subscription.id, planId: selectedPlanId },
      {
        onSuccess: () => {
          toast.success(t('subscriptions.planChanged'));
          onOpenChange(false);
        },
        onError: () => {
          toast.error(t('errors.serverError'));
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('subscriptions.changePlan')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t('subscriptions.tenantName')}</Label>
            <p className="text-sm text-muted-foreground">
              {subscription?.tenant?.name ?? '—'}
            </p>
          </div>
          <div className="space-y-2">
            <Label>{t('subscriptions.selectPlan')}</Label>
            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
              <SelectTrigger>
                <SelectValue placeholder={t('subscriptions.selectPlan')} />
              </SelectTrigger>
              <SelectContent>
                {(plans ?? []).map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={
                changePlanMutation.isPending ||
                selectedPlanId === subscription?.planId
              }
            >
              {changePlanMutation.isPending
                ? t('common.loading')
                : t('common.confirm')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
