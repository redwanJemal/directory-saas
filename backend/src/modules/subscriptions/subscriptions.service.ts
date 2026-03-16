import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantCacheService } from '../../common/services/tenant-cache.service';
import { ServiceResult } from '../../common/types';
import { PaginatedResult, paginate } from '../../common/dto/pagination.dto';
import { ErrorCodes } from '../../common/constants/error-codes';
import { CreatePlanDto, UpdatePlanDto, AssignSubscriptionDto, SetOverridesDto, ChangeSubscriptionPlanDto } from './dto';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: TenantCacheService,
  ) {}

  // === Plan CRUD (Admin) ===

  async createPlan(dto: CreatePlanDto): Promise<ServiceResult<unknown>> {
    const existing = await this.prisma.subscriptionPlan.findUnique({
      where: { name: dto.name },
    });
    if (existing) {
      return ServiceResult.fail(
        ErrorCodes.ALREADY_EXISTS,
        `Plan '${dto.name}' already exists`,
      );
    }

    const plan = await this.prisma.subscriptionPlan.create({
      data: {
        name: dto.name,
        displayName: dto.displayName,
        description: dto.description,
        priceMonthly: dto.priceMonthly,
        priceYearly: dto.priceYearly,
        maxUsers: dto.maxUsers,
        maxStorage: dto.maxStorage,
        features: dto.features,
        sortOrder: dto.sortOrder ?? 0,
      },
    });

    return ServiceResult.ok(plan);
  }

  async listPlans(activeOnly = false): Promise<ServiceResult<unknown>> {
    const where = activeOnly ? { isActive: true } : {};
    const plans = await this.prisma.subscriptionPlan.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });
    return ServiceResult.ok(plans);
  }

  async getPlan(id: string): Promise<ServiceResult<unknown>> {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
    });
    if (!plan) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Plan not found');
    }
    return ServiceResult.ok(plan);
  }

  async updatePlan(id: string, dto: UpdatePlanDto): Promise<ServiceResult<unknown>> {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
    });
    if (!plan) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Plan not found');
    }

    // Check name uniqueness if name is being changed
    if (dto.name && dto.name !== plan.name) {
      const existing = await this.prisma.subscriptionPlan.findUnique({
        where: { name: dto.name },
      });
      if (existing) {
        return ServiceResult.fail(
          ErrorCodes.ALREADY_EXISTS,
          `Plan '${dto.name}' already exists`,
        );
      }
    }

    const updated = await this.prisma.subscriptionPlan.update({
      where: { id },
      data: dto,
    });

    // Invalidate cached plan data for all tenants on this plan
    await this.invalidatePlanCaches(id);

    return ServiceResult.ok(updated);
  }

  async deactivatePlan(id: string): Promise<ServiceResult<unknown>> {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
    });
    if (!plan) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Plan not found');
    }

    // Check if any active subscriptions use this plan
    const activeSubscriptions = await this.prisma.tenantSubscription.count({
      where: { planId: id, status: 'ACTIVE' },
    });
    if (activeSubscriptions > 0) {
      return ServiceResult.fail(
        ErrorCodes.CONFLICT,
        `Cannot deactivate plan with ${activeSubscriptions} active subscription(s)`,
      );
    }

    const updated = await this.prisma.subscriptionPlan.update({
      where: { id },
      data: { isActive: false },
    });

    return ServiceResult.ok(updated);
  }

  // === Tenant Subscription ===

  async getTenantSubscription(tenantId: string): Promise<ServiceResult<unknown>> {
    const subscription = await this.prisma.tenantSubscription.findUnique({
      where: { tenantId },
      include: { plan: true },
    });

    if (!subscription) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'No subscription found for this tenant');
    }

    return ServiceResult.ok(subscription);
  }

  async assignSubscription(
    tenantId: string,
    dto: AssignSubscriptionDto,
  ): Promise<ServiceResult<unknown>> {
    // Verify tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Tenant not found');
    }

    // Verify plan exists and is active
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: dto.planId },
    });
    if (!plan) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Plan not found');
    }
    if (!plan.isActive) {
      return ServiceResult.fail(ErrorCodes.CONFLICT, 'Cannot assign an inactive plan');
    }

    const subscription = await this.prisma.tenantSubscription.upsert({
      where: { tenantId },
      update: {
        planId: dto.planId,
        status: dto.status,
        startedAt: dto.startedAt ?? new Date(),
        renewsAt: dto.renewsAt,
      },
      create: {
        tenantId,
        planId: dto.planId,
        status: dto.status,
        startedAt: dto.startedAt ?? new Date(),
        renewsAt: dto.renewsAt,
      },
      include: { plan: true },
    });

    await this.invalidateTenantCaches(tenantId);

    return ServiceResult.ok(subscription);
  }

  async setOverrides(
    tenantId: string,
    dto: SetOverridesDto,
  ): Promise<ServiceResult<unknown>> {
    const subscription = await this.prisma.tenantSubscription.findUnique({
      where: { tenantId },
    });

    if (!subscription) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'No subscription found for this tenant');
    }

    // Merge with existing overrides
    const existingOverrides = (subscription.overrides as Record<string, unknown>) || {};
    const newOverrides: Record<string, unknown> = { ...existingOverrides };

    if (dto.maxUsers !== undefined) newOverrides.users = dto.maxUsers;
    if (dto.maxStorage !== undefined) newOverrides.storage = dto.maxStorage;
    if (dto.features !== undefined) newOverrides.features = dto.features;

    const updated = await this.prisma.tenantSubscription.update({
      where: { tenantId },
      data: { overrides: newOverrides as object },
      include: { plan: true },
    });

    await this.invalidateTenantCaches(tenantId);

    return ServiceResult.ok(updated);
  }

  // === Usage ===

  async getUsageSummary(tenantId: string): Promise<ServiceResult<unknown>> {
    const subscription = await this.prisma.tenantSubscription.findUnique({
      where: { tenantId },
      include: { plan: true },
    });

    if (!subscription) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'No subscription found for this tenant');
    }

    const userCount = await this.prisma.tenantUser.count({
      where: {
        tenantId,
        isActive: true,
        deletedAt: null,
      },
    });

    const overrides = (subscription.overrides as Record<string, number>) || {};

    return ServiceResult.ok({
      plan: {
        name: subscription.plan.name,
        displayName: subscription.plan.displayName,
      },
      usage: {
        users: {
          current: userCount,
          limit: overrides.users ?? subscription.plan.maxUsers,
          unlimited: (overrides.users ?? subscription.plan.maxUsers) === -1,
        },
        storage: {
          current: 0, // Will be tracked via storage module (Task 15)
          limit: overrides.storage ?? subscription.plan.maxStorage,
          unlimited: (overrides.storage ?? subscription.plan.maxStorage) === -1,
        },
      },
      features: subscription.plan.features,
      overrides: subscription.overrides,
    });
  }

  // === Admin Subscription List ===

  async listAllSubscriptions(
    page: number,
    pageSize: number,
    filters?: { status?: string },
  ): Promise<ServiceResult<unknown>> {
    const where: Record<string, unknown> = {};
    if (filters?.status) {
      where.status = filters.status;
    }

    const [rawItems, totalCount] = await Promise.all([
      this.prisma.tenantSubscription.findMany({
        where,
        include: { tenant: { select: { id: true, name: true } }, plan: { select: { id: true, name: true, displayName: true } } },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tenantSubscription.count({ where }),
    ]);

    const items = rawItems.map((s) => ({
      id: s.id,
      tenantId: s.tenantId,
      tenant: s.tenant,
      planId: s.planId,
      plan: s.plan,
      status: s.status.toLowerCase(),
      startDate: s.startedAt?.toISOString() ?? null,
      endDate: s.renewsAt?.toISOString() ?? null,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));

    return ServiceResult.ok(paginate(items, totalCount, { page, pageSize }));
  }

  async changeSubscriptionPlan(
    subscriptionId: string,
    dto: ChangeSubscriptionPlanDto,
  ): Promise<ServiceResult<unknown>> {
    const subscription = await this.prisma.tenantSubscription.findUnique({
      where: { id: subscriptionId },
    });
    if (!subscription) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Subscription not found');
    }

    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: dto.planId },
    });
    if (!plan) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Plan not found');
    }
    if (!plan.isActive) {
      return ServiceResult.fail(ErrorCodes.CONFLICT, 'Cannot assign an inactive plan');
    }

    const updated = await this.prisma.tenantSubscription.update({
      where: { id: subscriptionId },
      data: { planId: dto.planId },
      include: { tenant: true, plan: true },
    });

    await this.invalidateTenantCaches(subscription.tenantId);

    return ServiceResult.ok(updated);
  }

  // === Cache invalidation ===

  private async invalidateTenantCaches(tenantId: string): Promise<void> {
    await this.cache.invalidateByPattern(`saas:${tenantId}:plan-limits`);
    await this.cache.invalidateByPattern(`saas:${tenantId}:features`);
    await this.cache.invalidateByPattern(`saas:${tenantId}:usage:`);
  }

  private async invalidatePlanCaches(planId: string): Promise<void> {
    // Find all tenants on this plan and invalidate their caches
    const subscriptions = await this.prisma.tenantSubscription.findMany({
      where: { planId },
      select: { tenantId: true },
    });

    for (const sub of subscriptions) {
      await this.invalidateTenantCaches(sub.tenantId);
    }
  }
}
