import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { RateLimitService, RateLimitResult } from '../services/rate-limit.service';
import { AppException } from '../exceptions/app.exception';
import { ErrorCodes } from '../constants/error-codes';
import { RequestContext } from '../services/request-context';
import {
  THROTTLE_KEY,
  SKIP_THROTTLE_KEY,
  ThrottleOptions,
} from '../decorators/throttle.decorator';

export const THROTTLER_CONFIG = 'THROTTLER_CONFIG';

export interface ThrottlerConfig {
  /** Global per-IP limit */
  limit: number;
  /** Global window in seconds */
  ttl: number;
}

interface RateLimitTier {
  key: string;
  limit: number;
  ttl: number;
}

@Injectable()
export class ThrottlerGuard implements CanActivate {
  private readonly logger = new Logger(ThrottlerGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly rateLimitService: RateLimitService,
    @Inject(THROTTLER_CONFIG) private readonly config: ThrottlerConfig,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check @SkipThrottle() decorator
    const skipThrottle = this.reflector.getAllAndOverride<boolean>(
      SKIP_THROTTLE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (skipThrottle) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const ip = this.getClientIp(request);
    const tenantId = RequestContext.tenantId;
    const user = (request as unknown as Record<string, unknown>).user as
      | Record<string, unknown>
      | undefined;
    const userId =
      RequestContext.userId ?? (user?.sub as string | undefined);
    const routePath = this.getRoutePath(context);

    // Check for @Throttle() override
    const throttleOverride = this.reflector.getAllAndOverride<ThrottleOptions>(
      THROTTLE_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Build rate limit tiers to check
    const tiers = this.buildTiers(
      ip,
      tenantId,
      userId,
      routePath,
      throttleOverride,
    );

    // Check all tiers — use the most restrictive result
    let mostRestrictiveResult: RateLimitResult | null = null;
    let mostRestrictiveTier: RateLimitTier | null = null;

    for (const tier of tiers) {
      const result = await this.rateLimitService.check(
        tier.key,
        tier.limit,
        tier.ttl,
      );

      if (
        !mostRestrictiveResult ||
        result.remaining < mostRestrictiveResult.remaining ||
        !result.allowed
      ) {
        mostRestrictiveResult = result;
        mostRestrictiveTier = tier;
      }

      if (!result.allowed) {
        break;
      }
    }

    if (!mostRestrictiveResult || !mostRestrictiveTier) {
      return true;
    }

    // Set rate limit headers on response
    this.setHeaders(response, mostRestrictiveResult);

    if (!mostRestrictiveResult.allowed) {
      if (mostRestrictiveResult.retryAfter) {
        response.setHeader('Retry-After', mostRestrictiveResult.retryAfter);
      }
      this.logger.warn(
        `Rate limit exceeded: ${mostRestrictiveTier.key} (${mostRestrictiveTier.limit}/${mostRestrictiveTier.ttl}s)`,
      );
      throw new AppException(
        ErrorCodes.RATE_LIMIT_EXCEEDED,
        'Too many requests. Please try again later.',
      );
    }

    return true;
  }

  private getClientIp(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = typeof forwarded === 'string' ? forwarded : forwarded[0];
      return ips.split(',')[0].trim();
    }
    return request.ip || request.socket?.remoteAddress || '127.0.0.1';
  }

  private getRoutePath(context: ExecutionContext): string {
    const controller = context.getClass().name;
    const handler = context.getHandler().name;
    return `${controller}:${handler}`;
  }

  private isAuthEndpoint(routePath: string): boolean {
    return routePath.toLowerCase().includes('auth');
  }

  private isUploadEndpoint(routePath: string): boolean {
    return routePath.toLowerCase().includes('upload');
  }

  private buildTiers(
    ip: string,
    tenantId: string | undefined,
    userId: string | undefined,
    routePath: string,
    override: ThrottleOptions | undefined,
  ): RateLimitTier[] {
    const tiers: RateLimitTier[] = [];

    // If there's a @Throttle() override, use it as the only tier
    if (override) {
      const key = userId
        ? `rl:custom:${userId}:${routePath}`
        : `rl:custom:${ip}:${routePath}`;
      tiers.push({ key, limit: override.limit, ttl: override.ttl });
      return tiers;
    }

    // Tier 1: Global per-IP (or stricter for auth/upload endpoints)
    if (this.isAuthEndpoint(routePath)) {
      tiers.push({ key: `rl:auth:${ip}`, limit: 10, ttl: 60 });
    } else if (this.isUploadEndpoint(routePath)) {
      const uploadKey = userId ? `rl:upload:${userId}` : `rl:upload:${ip}`;
      tiers.push({ key: uploadKey, limit: 20, ttl: 60 });
    } else {
      tiers.push({
        key: `rl:ip:${ip}`,
        limit: this.config.limit,
        ttl: this.config.ttl,
      });
    }

    // Tier 2: Per tenant
    if (tenantId) {
      tiers.push({ key: `rl:tenant:${tenantId}`, limit: 1000, ttl: 60 });
    }

    // Tier 3: Per user
    if (userId) {
      tiers.push({ key: `rl:user:${userId}`, limit: 300, ttl: 60 });
    }

    return tiers;
  }

  private setHeaders(response: Response, result: RateLimitResult): void {
    response.setHeader('X-RateLimit-Limit', result.limit);
    response.setHeader('X-RateLimit-Remaining', result.remaining);
    response.setHeader('X-RateLimit-Reset', result.resetTime);
  }
}
