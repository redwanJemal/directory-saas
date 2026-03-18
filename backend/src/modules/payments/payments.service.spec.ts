import { PaymentsService } from './payments.service';
import { TenantCacheService } from '../../common/services/tenant-cache.service';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: any;
  let config: any;
  let cache: TenantCacheService;

  beforeEach(() => {
    cache = new TenantCacheService();
    config = {
      stripe: {
        secretKey: '',
        publishableKey: '',
        webhookSecret: 'whsec_test',
      },
    };
    prisma = {
      subscriptionPlan: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      tenantSubscription: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
      },
      tenant: {
        findUnique: jest.fn(),
      },
      payment: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        aggregate: jest.fn(),
      },
    };
    service = new PaymentsService(prisma, config, cache);
  });

  describe('createCheckoutSession', () => {
    it('should fail when Stripe is not configured', async () => {
      const result = await service.createCheckoutSession('tenant-1', {
        planId: 'plan-1',
        interval: 'monthly',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SERVICE_UNAVAILABLE');
    });
  });

  describe('createBillingPortalSession', () => {
    it('should fail when Stripe is not configured', async () => {
      const result = await service.createBillingPortalSession(
        'tenant-1',
        'https://example.com/return',
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SERVICE_UNAVAILABLE');
    });
  });

  describe('getPaymentHistory', () => {
    it('should return paginated payment history', async () => {
      prisma.tenantSubscription.findUnique.mockResolvedValue({
        id: 'sub-1',
      });
      prisma.payment.findMany.mockResolvedValue([
        {
          id: 'pay-1',
          amount: { toNumber: () => 29.99 },
          currency: 'USD',
          status: 'succeeded',
          description: 'Invoice #1',
          paidAt: new Date('2026-03-01'),
          createdAt: new Date('2026-03-01'),
        },
      ]);
      prisma.payment.count.mockResolvedValue(1);

      const result = await service.getPaymentHistory('tenant-1', 1, 10);

      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.data).toHaveLength(1);
      expect(data.data[0].amount).toBe(29.99);
      expect(data.pagination.totalCount).toBe(1);
    });

    it('should fail if no subscription found', async () => {
      prisma.tenantSubscription.findUnique.mockResolvedValue(null);

      const result = await service.getPaymentHistory('tenant-1', 1, 10);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });
  });

  describe('getRevenueStats', () => {
    it('should return revenue statistics', async () => {
      prisma.payment.aggregate
        .mockResolvedValueOnce({ _sum: { amount: { toNumber: () => 1500 } } })
        .mockResolvedValueOnce({ _sum: { amount: { toNumber: () => 300 } } });
      prisma.tenantSubscription.count.mockResolvedValue(10);
      prisma.tenantSubscription.groupBy.mockResolvedValue([
        { planId: 'plan-1', _count: { id: 5 } },
        { planId: 'plan-2', _count: { id: 5 } },
      ]);
      prisma.subscriptionPlan.findMany.mockResolvedValue([
        { id: 'plan-1', displayName: 'Starter' },
        { id: 'plan-2', displayName: 'Pro' },
      ]);
      prisma.payment.findMany.mockResolvedValue([]);

      const result = await service.getRevenueStats();

      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.totalRevenue).toBe(1500);
      expect(data.monthlyRevenue).toBe(300);
      expect(data.activeSubscriptions).toBe(10);
      expect(data.subscriptionsByPlan).toHaveLength(2);
    });

    it('should handle empty revenue', async () => {
      prisma.payment.aggregate
        .mockResolvedValueOnce({ _sum: { amount: null } })
        .mockResolvedValueOnce({ _sum: { amount: null } });
      prisma.tenantSubscription.count.mockResolvedValue(0);
      prisma.tenantSubscription.groupBy.mockResolvedValue([]);
      prisma.payment.findMany.mockResolvedValue([]);

      const result = await service.getRevenueStats();

      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.totalRevenue).toBe(0);
      expect(data.monthlyRevenue).toBe(0);
      expect(data.activeSubscriptions).toBe(0);
    });
  });

  describe('handleWebhook', () => {
    it('should fail if Stripe is not configured', async () => {
      const serviceNoStripe = new PaymentsService(
        prisma,
        { stripe: { secretKey: '', publishableKey: '', webhookSecret: '' } } as any,
        cache,
      );

      const result = await serviceNoStripe.handleWebhook(
        Buffer.from('test'),
        'sig_test',
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SERVICE_UNAVAILABLE');
    });
  });
});
