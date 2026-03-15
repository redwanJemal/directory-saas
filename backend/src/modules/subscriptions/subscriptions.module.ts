import { Module } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import {
  AdminPlansController,
  AdminTenantSubscriptionController,
  PublicPlansController,
  TenantSubscriptionController,
} from './subscriptions.controller';
import { PlanLimitGuard } from '../../common/guards/plan-limit.guard';
import { FeatureGateGuard } from '../../common/guards/feature-gate.guard';

@Module({
  controllers: [
    AdminPlansController,
    AdminTenantSubscriptionController,
    PublicPlansController,
    TenantSubscriptionController,
  ],
  providers: [SubscriptionsService, PlanLimitGuard, FeatureGateGuard],
  exports: [SubscriptionsService, PlanLimitGuard, FeatureGateGuard],
})
export class SubscriptionsModule {}
