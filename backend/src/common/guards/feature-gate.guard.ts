import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantCacheService } from '../services/tenant-cache.service';
import { FEATURE_GATE_KEY } from '../decorators/feature-gate.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AppException } from '../exceptions/app.exception';
import { ErrorCodes } from '../constants/error-codes';
import { RequestContext } from '../services/request-context';

const FEATURES_CACHE_TTL_MS = 60_000; // 60 seconds

@Injectable()
export class FeatureGateGuard implements CanActivate {
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

    const requiredFeature = this.reflector.get<string>(FEATURE_GATE_KEY, context.getHandler());
    if (!requiredFeature) return true;

    const tenantId = RequestContext.tenantId;
    if (!tenantId) {
      throw new AppException(ErrorCodes.TENANT_REQUIRED, 'Tenant context is required');
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Admin users bypass feature gates
    if (user?.userType === 'admin') return true;

    const features = await this.getTenantFeatures(tenantId);
    if (!features) {
      throw new AppException(ErrorCodes.FEATURE_NOT_AVAILABLE, 'No active subscription found');
    }

    if (!features.includes(requiredFeature)) {
      throw new AppException(
        ErrorCodes.FEATURE_NOT_AVAILABLE,
        `Feature '${requiredFeature}' is not available on your current plan`,
      );
    }

    return true;
  }

  async getTenantFeatures(tenantId: string): Promise<string[] | null> {
    const cacheKey = `saas:${tenantId}:features`;
    const cached = await this.cache.get<string[]>(cacheKey);
    if (cached) return cached;

    const subscription = await this.prisma.tenantSubscription.findUnique({
      where: { tenantId },
      include: { plan: true },
    });

    if (!subscription || subscription.status === 'CANCELLED') {
      return null;
    }

    // Start with plan features
    let features = subscription.plan.features as string[];
    if (!Array.isArray(features)) {
      features = [];
    }

    // Merge override features if present
    const overrides = subscription.overrides as Record<string, unknown> | null;
    if (overrides && Array.isArray(overrides.features)) {
      const overrideFeatures = overrides.features as string[];
      features = [...new Set([...features, ...overrideFeatures])];
    }

    await this.cache.set(cacheKey, features, FEATURES_CACHE_TTL_MS);
    return features;
  }
}
