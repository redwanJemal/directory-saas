import { SubscriptionsService } from './subscriptions.service';
import { TenantCacheService } from '../../common/services/tenant-cache.service';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let prisma: any;
  let cache: TenantCacheService;

  beforeEach(() => {
    cache = new TenantCacheService();
    prisma = {
      subscriptionPlan: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      tenantSubscription: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      tenant: {
        findUnique: jest.fn(),
      },
      tenantUser: {
        count: jest.fn(),
      },
    };
    service = new SubscriptionsService(prisma, cache);
  });

  describe('createPlan', () => {
    it('should create a new plan', async () => {
      const dto = {
        name: 'test-plan',
        displayName: 'Test Plan',
        priceMonthly: 10,
        priceYearly: 100,
        maxUsers: 5,
        maxStorage: 1000,
        features: ['basic-analytics'],
        sortOrder: 0,
      };

      prisma.subscriptionPlan.findUnique.mockResolvedValue(null);
      prisma.subscriptionPlan.create.mockResolvedValue({ id: 'plan-1', ...dto });

      const result = await service.createPlan(dto);
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({ name: 'test-plan' });
    });

    it('should fail if plan name already exists', async () => {
      prisma.subscriptionPlan.findUnique.mockResolvedValue({ id: 'existing' });

      const result = await service.createPlan({
        name: 'starter',
        displayName: 'Starter',
        priceMonthly: 0,
        priceYearly: 0,
        maxUsers: 3,
        maxStorage: 500,
        features: [],
        sortOrder: 0,
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('ALREADY_EXISTS');
    });
  });

  describe('listPlans', () => {
    it('should list all plans', async () => {
      prisma.subscriptionPlan.findMany.mockResolvedValue([
        { name: 'starter' },
        { name: 'professional' },
      ]);

      const result = await service.listPlans(false);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    it('should list only active plans when activeOnly is true', async () => {
      prisma.subscriptionPlan.findMany.mockResolvedValue([{ name: 'starter', isActive: true }]);

      const result = await service.listPlans(true);
      expect(result.success).toBe(true);
      expect(prisma.subscriptionPlan.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });
    });
  });

  describe('updatePlan', () => {
    it('should update an existing plan', async () => {
      prisma.subscriptionPlan.findUnique.mockResolvedValue({ id: 'plan-1', name: 'starter' });
      prisma.subscriptionPlan.update.mockResolvedValue({ id: 'plan-1', displayName: 'Updated' });
      prisma.tenantSubscription.findMany.mockResolvedValue([]);

      const result = await service.updatePlan('plan-1', { displayName: 'Updated' });
      expect(result.success).toBe(true);
    });

    it('should fail if plan not found', async () => {
      prisma.subscriptionPlan.findUnique.mockResolvedValue(null);

      const result = await service.updatePlan('nope', { displayName: 'X' });
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });

    it('should fail if renaming to existing name', async () => {
      prisma.subscriptionPlan.findUnique
        .mockResolvedValueOnce({ id: 'plan-1', name: 'starter' })
        .mockResolvedValueOnce({ id: 'plan-2', name: 'professional' });

      const result = await service.updatePlan('plan-1', { name: 'professional' });
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('ALREADY_EXISTS');
    });
  });

  describe('deactivatePlan', () => {
    it('should deactivate a plan with no active subscriptions', async () => {
      prisma.subscriptionPlan.findUnique.mockResolvedValue({ id: 'plan-1' });
      prisma.tenantSubscription.count.mockResolvedValue(0);
      prisma.subscriptionPlan.update.mockResolvedValue({ id: 'plan-1', isActive: false });

      const result = await service.deactivatePlan('plan-1');
      expect(result.success).toBe(true);
    });

    it('should fail if plan has active subscriptions', async () => {
      prisma.subscriptionPlan.findUnique.mockResolvedValue({ id: 'plan-1' });
      prisma.tenantSubscription.count.mockResolvedValue(3);

      const result = await service.deactivatePlan('plan-1');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('CONFLICT');
    });

    it('should fail if plan not found', async () => {
      prisma.subscriptionPlan.findUnique.mockResolvedValue(null);

      const result = await service.deactivatePlan('nope');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });
  });

  describe('getTenantSubscription', () => {
    it('should return subscription with plan', async () => {
      prisma.tenantSubscription.findUnique.mockResolvedValue({
        id: 'sub-1',
        plan: { name: 'starter' },
      });

      const result = await service.getTenantSubscription('tenant-1');
      expect(result.success).toBe(true);
    });

    it('should fail if no subscription', async () => {
      prisma.tenantSubscription.findUnique.mockResolvedValue(null);

      const result = await service.getTenantSubscription('tenant-1');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });
  });

  describe('assignSubscription', () => {
    it('should assign a plan to a tenant', async () => {
      prisma.tenant.findUnique.mockResolvedValue({ id: 'tenant-1' });
      prisma.subscriptionPlan.findUnique.mockResolvedValue({ id: 'plan-1', isActive: true });
      prisma.tenantSubscription.upsert.mockResolvedValue({
        tenantId: 'tenant-1',
        planId: 'plan-1',
        plan: { name: 'professional' },
      });

      const result = await service.assignSubscription('tenant-1', {
        planId: 'plan-1',
        status: 'ACTIVE',
      });
      expect(result.success).toBe(true);
    });

    it('should fail if tenant not found', async () => {
      prisma.tenant.findUnique.mockResolvedValue(null);

      const result = await service.assignSubscription('nope', {
        planId: 'plan-1',
        status: 'ACTIVE',
      });
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });

    it('should fail if plan is inactive', async () => {
      prisma.tenant.findUnique.mockResolvedValue({ id: 'tenant-1' });
      prisma.subscriptionPlan.findUnique.mockResolvedValue({ id: 'plan-1', isActive: false });

      const result = await service.assignSubscription('tenant-1', {
        planId: 'plan-1',
        status: 'ACTIVE',
      });
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('CONFLICT');
    });
  });

  describe('setOverrides', () => {
    it('should set overrides on a subscription', async () => {
      prisma.tenantSubscription.findUnique.mockResolvedValue({
        tenantId: 'tenant-1',
        overrides: {},
      });
      prisma.tenantSubscription.update.mockResolvedValue({
        tenantId: 'tenant-1',
        overrides: { users: 50, storage: 10000 },
        plan: { name: 'starter' },
      });

      const result = await service.setOverrides('tenant-1', {
        maxUsers: 50,
        maxStorage: 10000,
      });
      expect(result.success).toBe(true);
    });

    it('should fail if no subscription', async () => {
      prisma.tenantSubscription.findUnique.mockResolvedValue(null);

      const result = await service.setOverrides('nope', { maxUsers: 50 });
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });

    it('should merge with existing overrides', async () => {
      prisma.tenantSubscription.findUnique.mockResolvedValue({
        tenantId: 'tenant-1',
        overrides: { users: 10 },
      });
      prisma.tenantSubscription.update.mockResolvedValue({
        tenantId: 'tenant-1',
        overrides: { users: 10, storage: 5000 },
        plan: { name: 'starter' },
      });

      const result = await service.setOverrides('tenant-1', { maxStorage: 5000 });
      expect(result.success).toBe(true);
      expect(prisma.tenantSubscription.update).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        data: { overrides: { users: 10, storage: 5000 } },
        include: { plan: true },
      });
    });
  });

  describe('getUsageSummary', () => {
    it('should return usage summary for a tenant', async () => {
      prisma.tenantSubscription.findUnique.mockResolvedValue({
        plan: {
          name: 'starter',
          displayName: 'Starter',
          maxUsers: 3,
          maxStorage: 500,
          features: ['basic-analytics'],
        },
        overrides: null,
      });
      prisma.tenantUser.count.mockResolvedValue(2);

      const result = await service.getUsageSummary('tenant-1');
      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.usage.users.current).toBe(2);
      expect(data.usage.users.limit).toBe(3);
      expect(data.usage.users.unlimited).toBe(false);
    });

    it('should report unlimited when maxUsers is -1', async () => {
      prisma.tenantSubscription.findUnique.mockResolvedValue({
        plan: {
          name: 'enterprise',
          displayName: 'Enterprise',
          maxUsers: -1,
          maxStorage: 50000,
          features: ['basic-analytics', 'ai-planner'],
        },
        overrides: null,
      });
      prisma.tenantUser.count.mockResolvedValue(100);

      const result = await service.getUsageSummary('tenant-1');
      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.usage.users.unlimited).toBe(true);
    });
  });
});
