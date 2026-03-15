import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantCacheService } from '../services/tenant-cache.service';
import { PLAN_LIMIT_KEY } from '../decorators/plan-limit.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AppException } from '../exceptions/app.exception';
import { ErrorCodes } from '../constants/error-codes';
import { RequestContext } from '../services/request-context';

const USAGE_CACHE_TTL_MS = 60_000; // 60 seconds

interface PlanLimits {
  maxUsers: number;
  maxStorage: number;
  overrides: Record<string, number> | null;
}

@Injectable()
export class PlanLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly cache: TenantCacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const limitResource = this.reflector.get<string>(PLAN_LIMIT_KEY, context.getHandler());
    if (!limitResource) return true;

    const tenantId = RequestContext.tenantId;
    if (!tenantId) {
      throw new AppException(ErrorCodes.TENANT_REQUIRED, 'Tenant context is required');
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Admin users bypass plan limits
    if (user?.userType === 'admin') return true;

    const planLimits = await this.getTenantPlanLimits(tenantId);
    if (!planLimits) {
      throw new AppException(ErrorCodes.PLAN_LIMIT_REACHED, 'No active subscription found');
    }

    const limit = this.getEffectiveLimit(planLimits, limitResource);

    // -1 means unlimited
    if (limit === -1) return true;

    const usage = await this.getCurrentUsage(tenantId, limitResource);

    if (usage >= limit) {
      throw new AppException(
        ErrorCodes.PLAN_LIMIT_REACHED,
        `Plan limit reached for ${limitResource}. Current: ${usage}, Limit: ${limit}`,
      );
    }

    return true;
  }

  private getEffectiveLimit(planLimits: PlanLimits, resource: string): number {
    // Check overrides first
    if (planLimits.overrides && resource in planLimits.overrides) {
      return planLimits.overrides[resource];
    }

    // Map resource name to plan field
    const limitMap: Record<string, number> = {
      users: planLimits.maxUsers,
      storage: planLimits.maxStorage,
    };

    const limit = limitMap[resource];
    if (limit === undefined) {
      // Unknown resource — allow by default
      return -1;
    }

    return limit;
  }

  async getTenantPlanLimits(tenantId: string): Promise<PlanLimits | null> {
    const cacheKey = `saas:${tenantId}:plan-limits`;
    const cached = await this.cache.get<PlanLimits>(cacheKey);
    if (cached) return cached;

    const subscription = await this.prisma.tenantSubscription.findUnique({
      where: { tenantId },
      include: { plan: true },
    });

    if (!subscription || subscription.status === 'CANCELLED') {
      return null;
    }

    const overrides = subscription.overrides as Record<string, number> | null;

    const limits: PlanLimits = {
      maxUsers: subscription.plan.maxUsers,
      maxStorage: subscription.plan.maxStorage,
      overrides,
    };

    await this.cache.set(cacheKey, limits, USAGE_CACHE_TTL_MS);
    return limits;
  }

  async getCurrentUsage(tenantId: string, resource: string): Promise<number> {
    const cacheKey = `saas:${tenantId}:usage:${resource}`;
    const cached = await this.cache.get<number>(cacheKey);
    if (cached !== null) return cached;

    let usage = 0;

    switch (resource) {
      case 'users':
        usage = await this.prisma.tenantUser.count({
          where: {
            tenantId,
            isActive: true,
            deletedAt: null,
          },
        });
        break;
      case 'storage':
        // Storage usage will be tracked via the storage module (Task 15)
        // For now, return 0
        usage = 0;
        break;
      default:
        usage = 0;
    }

    await this.cache.set(cacheKey, usage, USAGE_CACHE_TTL_MS);
    return usage;
  }
}
