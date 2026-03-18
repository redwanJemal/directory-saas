import { PaymentsController, AdminPaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { ServiceResult } from '../../common/types';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let service: Partial<Record<keyof PaymentsService, jest.Mock>>;

  beforeEach(() => {
    service = {
      createCheckoutSession: jest.fn(),
      createBillingPortalSession: jest.fn(),
      getPaymentHistory: jest.fn(),
    };
    controller = new PaymentsController(service as unknown as PaymentsService);
  });

  describe('createCheckout', () => {
    it('should return checkout session data on success', async () => {
      const sessionData = { sessionId: 'cs_test', url: 'https://checkout.stripe.com/test' };
      service.createCheckoutSession!.mockResolvedValue(
        ServiceResult.ok(sessionData),
      );

      const result = await controller.createCheckout('tenant-1', {
        planId: 'plan-1',
        interval: 'monthly',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });

      expect(result).toEqual(sessionData);
    });

    it('should throw on failure', async () => {
      service.createCheckoutSession!.mockResolvedValue(
        ServiceResult.fail('NOT_FOUND', 'Plan not found'),
      );

      await expect(
        controller.createCheckout('tenant-1', {
          planId: 'plan-1',
          interval: 'monthly',
          successUrl: 'https://example.com/success',
          cancelUrl: 'https://example.com/cancel',
        }),
      ).rejects.toThrow();
    });
  });

  describe('getPaymentHistory', () => {
    it('should return paginated payments', async () => {
      const historyData = {
        data: [],
        pagination: { page: 1, pageSize: 20, totalCount: 0, totalPages: 0 },
      };
      service.getPaymentHistory!.mockResolvedValue(
        ServiceResult.ok(historyData),
      );

      const result = await controller.getPaymentHistory('tenant-1', '1', '20');
      expect(result).toEqual(historyData);
    });
  });
});

describe('AdminPaymentsController', () => {
  let controller: AdminPaymentsController;
  let service: Partial<Record<keyof PaymentsService, jest.Mock>>;

  beforeEach(() => {
    service = {
      getRevenueStats: jest.fn(),
    };
    controller = new AdminPaymentsController(
      service as unknown as PaymentsService,
    );
  });

  describe('getRevenueStats', () => {
    it('should return revenue stats', async () => {
      const stats = {
        totalRevenue: 1500,
        monthlyRevenue: 300,
        activeSubscriptions: 10,
        subscriptionsByPlan: [],
        recentPayments: [],
      };
      service.getRevenueStats!.mockResolvedValue(ServiceResult.ok(stats));

      const result = await controller.getRevenueStats();
      expect(result).toEqual(stats);
    });
  });
});
