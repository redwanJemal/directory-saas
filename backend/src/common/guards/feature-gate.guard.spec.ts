import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FeatureGateGuard } from './feature-gate.guard';
import { TenantCacheService } from '../services/tenant-cache.service';
import { AppException } from '../exceptions/app.exception';
import { FEATURE_GATE_KEY } from '../decorators/feature-gate.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { RequestContext } from '../services/request-context';

describe('FeatureGateGuard', () => {
  let guard: FeatureGateGuard;
  let reflector: Reflector;
  let prisma: any;
  let cache: TenantCacheService;

  const createMockContext = (user: any): ExecutionContext =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = new Reflector();
    cache = new TenantCacheService();
    prisma = {
      tenantSubscription: {
        findUnique: jest.fn(),
      },
    };
    guard = new FeatureGateGuard(reflector, prisma, cache);
  });

  const setupReflector = (feature: string | undefined) => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: string) => {
      if (key === IS_PUBLIC_KEY) return false;
      return undefined;
    });
    jest.spyOn(reflector, 'get').mockImplementation((key: string) => {
      if (key === FEATURE_GATE_KEY) return feature;
      return undefined;
    });
  };

  describe('canActivate', () => {
    it('should allow access for @Public() routes', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      const context = createMockContext(null);
      expect(await guard.canActivate(context)).toBe(true);
    });

    it('should allow access when no @FeatureGate decorator', async () => {
      setupReflector(undefined);

      const context = createMockContext({ sub: '1', userType: 'tenant' });
      expect(await guard.canActivate(context)).toBe(true);
    });

    it('should allow admin users to bypass feature gates', async () => {
      setupReflector('ai-planner');

      await RequestContext.cls.run(new Map([['tenantId', 'tenant-1']]), async () => {
        const context = createMockContext({ sub: '1', userType: 'admin' });
        expect(await guard.canActivate(context)).toBe(true);
      });
    });

    it('should allow when feature is in plan', async () => {
      setupReflector('ai-planner');
      prisma.tenantSubscription.findUnique.mockResolvedValue({
        status: 'ACTIVE',
        overrides: null,
        plan: {
          features: ['basic-analytics', 'ai-planner', 'api-access'],
        },
      });

      await RequestContext.cls.run(new Map([['tenantId', 'tenant-2']]), async () => {
        const context = createMockContext({ sub: '1', userType: 'tenant' });
        expect(await guard.canActivate(context)).toBe(true);
      });
    });

    it('should block when feature is not in plan', async () => {
      setupReflector('ai-planner');
      prisma.tenantSubscription.findUnique.mockResolvedValue({
        status: 'ACTIVE',
        overrides: null,
        plan: {
          features: ['basic-analytics'],
        },
      });

      await RequestContext.cls.run(new Map([['tenantId', 'tenant-3']]), async () => {
        const context = createMockContext({ sub: '1', userType: 'tenant' });
        await expect(guard.canActivate(context)).rejects.toThrow(AppException);
      });
    });

    it('should include override features when checking', async () => {
      setupReflector('ai-planner');
      prisma.tenantSubscription.findUnique.mockResolvedValue({
        status: 'ACTIVE',
        overrides: { features: ['ai-planner'] },
        plan: {
          features: ['basic-analytics'],
        },
      });

      await RequestContext.cls.run(new Map([['tenantId', 'tenant-4']]), async () => {
        const context = createMockContext({ sub: '1', userType: 'tenant' });
        expect(await guard.canActivate(context)).toBe(true);
      });
    });

    it('should throw FEATURE_NOT_AVAILABLE when no subscription', async () => {
      setupReflector('ai-planner');
      prisma.tenantSubscription.findUnique.mockResolvedValue(null);

      await RequestContext.cls.run(new Map([['tenantId', 'tenant-5']]), async () => {
        const context = createMockContext({ sub: '1', userType: 'tenant' });
        await expect(guard.canActivate(context)).rejects.toThrow(AppException);
      });
    });

    it('should throw TENANT_REQUIRED when no tenant context', async () => {
      setupReflector('ai-planner');

      await RequestContext.cls.run(new Map(), async () => {
        const context = createMockContext({ sub: '1', userType: 'tenant' });
        await expect(guard.canActivate(context)).rejects.toThrow(AppException);
      });
    });
  });

  describe('feature caching', () => {
    it('should cache features from the subscription', async () => {
      prisma.tenantSubscription.findUnique.mockResolvedValue({
        status: 'ACTIVE',
        overrides: null,
        plan: { features: ['basic-analytics'] },
      });

      await guard.getTenantFeatures('tenant-cache-1');
      await guard.getTenantFeatures('tenant-cache-1');

      expect(prisma.tenantSubscription.findUnique).toHaveBeenCalledTimes(1);
    });
  });
});
