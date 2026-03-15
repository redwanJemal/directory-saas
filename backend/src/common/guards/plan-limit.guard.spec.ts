import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PlanLimitGuard } from './plan-limit.guard';
import { TenantCacheService } from '../services/tenant-cache.service';
import { AppException } from '../exceptions/app.exception';
import { PLAN_LIMIT_KEY } from '../decorators/plan-limit.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { RequestContext } from '../services/request-context';

describe('PlanLimitGuard', () => {
  let guard: PlanLimitGuard;
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
      tenantUser: {
        count: jest.fn(),
      },
    };
    guard = new PlanLimitGuard(reflector, prisma, cache);
  });

  const setupReflector = (limitResource: string | undefined) => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: string) => {
      if (key === IS_PUBLIC_KEY) return false;
      return undefined;
    });
    jest.spyOn(reflector, 'get').mockImplementation((key: string) => {
      if (key === PLAN_LIMIT_KEY) return limitResource;
      return undefined;
    });
  };

  describe('canActivate', () => {
    it('should allow access for @Public() routes', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      const context = createMockContext(null);
      expect(await guard.canActivate(context)).toBe(true);
    });

    it('should allow access when no @PlanLimit decorator', async () => {
      setupReflector(undefined);

      const context = createMockContext({ sub: '1', userType: 'tenant' });
      expect(await guard.canActivate(context)).toBe(true);
    });

    it('should allow admin users to bypass plan limits', async () => {
      setupReflector('users');

      await RequestContext.cls.run(new Map([['tenantId', 'tenant-1']]), async () => {
        const context = createMockContext({ sub: '1', userType: 'admin' });
        expect(await guard.canActivate(context)).toBe(true);
      });
    });

    it('should throw TENANT_REQUIRED when no tenant context', async () => {
      setupReflector('users');

      await RequestContext.cls.run(new Map(), async () => {
        const context = createMockContext({ sub: '1', userType: 'tenant' });
        await expect(guard.canActivate(context)).rejects.toThrow(AppException);
      });
    });

    it('should throw PLAN_LIMIT_REACHED when no subscription', async () => {
      setupReflector('users');
      prisma.tenantSubscription.findUnique.mockResolvedValue(null);

      await RequestContext.cls.run(new Map([['tenantId', 'tenant-1']]), async () => {
        const context = createMockContext({ sub: '1', userType: 'tenant' });
        await expect(guard.canActivate(context)).rejects.toThrow(AppException);
      });
    });

    it('should allow when usage is under limit', async () => {
      setupReflector('users');
      prisma.tenantSubscription.findUnique.mockResolvedValue({
        status: 'ACTIVE',
        overrides: null,
        plan: { maxUsers: 10, maxStorage: 5000 },
      });
      prisma.tenantUser.count.mockResolvedValue(5);

      await RequestContext.cls.run(new Map([['tenantId', 'tenant-2']]), async () => {
        const context = createMockContext({ sub: '1', userType: 'tenant' });
        expect(await guard.canActivate(context)).toBe(true);
      });
    });

    it('should block when usage reaches limit', async () => {
      setupReflector('users');
      prisma.tenantSubscription.findUnique.mockResolvedValue({
        status: 'ACTIVE',
        overrides: null,
        plan: { maxUsers: 3, maxStorage: 500 },
      });
      prisma.tenantUser.count.mockResolvedValue(3);

      await RequestContext.cls.run(new Map([['tenantId', 'tenant-3']]), async () => {
        const context = createMockContext({ sub: '1', userType: 'tenant' });
        await expect(guard.canActivate(context)).rejects.toThrow(AppException);
      });
    });

    it('should always allow when limit is -1 (unlimited)', async () => {
      setupReflector('users');
      prisma.tenantSubscription.findUnique.mockResolvedValue({
        status: 'ACTIVE',
        overrides: null,
        plan: { maxUsers: -1, maxStorage: 50000 },
      });
      prisma.tenantUser.count.mockResolvedValue(999);

      await RequestContext.cls.run(new Map([['tenantId', 'tenant-4']]), async () => {
        const context = createMockContext({ sub: '1', userType: 'tenant' });
        expect(await guard.canActivate(context)).toBe(true);
      });
    });

    it('should use per-tenant overrides instead of plan limits', async () => {
      setupReflector('users');
      prisma.tenantSubscription.findUnique.mockResolvedValue({
        status: 'ACTIVE',
        overrides: { users: 50 },
        plan: { maxUsers: 3, maxStorage: 500 },
      });
      prisma.tenantUser.count.mockResolvedValue(10);

      await RequestContext.cls.run(new Map([['tenantId', 'tenant-5']]), async () => {
        const context = createMockContext({ sub: '1', userType: 'tenant' });
        // Plan limit is 3, but override is 50 — usage 10 < 50, should allow
        expect(await guard.canActivate(context)).toBe(true);
      });
    });

    it('should block when override limit is reached', async () => {
      setupReflector('users');
      prisma.tenantSubscription.findUnique.mockResolvedValue({
        status: 'ACTIVE',
        overrides: { users: 5 },
        plan: { maxUsers: 25, maxStorage: 5000 },
      });
      prisma.tenantUser.count.mockResolvedValue(5);

      await RequestContext.cls.run(new Map([['tenantId', 'tenant-6']]), async () => {
        const context = createMockContext({ sub: '1', userType: 'tenant' });
        // Plan limit is 25, but override is 5 — usage 5 >= 5, should block
        await expect(guard.canActivate(context)).rejects.toThrow(AppException);
      });
    });

    it('should treat cancelled subscription as no subscription', async () => {
      setupReflector('users');
      prisma.tenantSubscription.findUnique.mockResolvedValue({
        status: 'CANCELLED',
        overrides: null,
        plan: { maxUsers: 25, maxStorage: 5000 },
      });

      await RequestContext.cls.run(new Map([['tenantId', 'tenant-7']]), async () => {
        const context = createMockContext({ sub: '1', userType: 'tenant' });
        await expect(guard.canActivate(context)).rejects.toThrow(AppException);
      });
    });
  });

  describe('usage caching', () => {
    it('should cache usage counts in the cache service', async () => {
      prisma.tenantUser.count.mockResolvedValue(5);

      await guard.getCurrentUsage('tenant-cache-1', 'users');
      await guard.getCurrentUsage('tenant-cache-1', 'users');

      // Second call should use cache
      expect(prisma.tenantUser.count).toHaveBeenCalledTimes(1);
    });
  });
});
