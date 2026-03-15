import { AdminPlansController, TenantSubscriptionController, PublicPlansController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { ServiceResult } from '../../common/types';
import { AppException } from '../../common/exceptions/app.exception';

describe('SubscriptionsController', () => {
  let service: Partial<SubscriptionsService>;

  beforeEach(() => {
    service = {
      createPlan: jest.fn(),
      listPlans: jest.fn(),
      updatePlan: jest.fn(),
      deactivatePlan: jest.fn(),
      getTenantSubscription: jest.fn(),
      getUsageSummary: jest.fn(),
    };
  });

  describe('AdminPlansController', () => {
    let controller: AdminPlansController;

    beforeEach(() => {
      controller = new AdminPlansController(service as SubscriptionsService);
    });

    it('should create a plan', async () => {
      const plan = { id: 'plan-1', name: 'test' };
      (service.createPlan as jest.Mock).mockResolvedValue(ServiceResult.ok(plan));

      const result = await controller.create({
        name: 'test',
        displayName: 'Test',
        priceMonthly: 10,
        priceYearly: 100,
        maxUsers: 5,
        maxStorage: 1000,
        features: [],
        sortOrder: 0,
      });
      expect(result).toEqual(plan);
    });

    it('should throw on create failure', async () => {
      (service.createPlan as jest.Mock).mockResolvedValue(
        ServiceResult.fail('ALREADY_EXISTS', 'Already exists'),
      );

      await expect(
        controller.create({
          name: 'starter',
          displayName: 'Starter',
          priceMonthly: 0,
          priceYearly: 0,
          maxUsers: 3,
          maxStorage: 500,
          features: [],
          sortOrder: 0,
        }),
      ).rejects.toThrow(AppException);
    });

    it('should list all plans', async () => {
      const plans = [{ name: 'starter' }, { name: 'professional' }];
      (service.listPlans as jest.Mock).mockResolvedValue(ServiceResult.ok(plans));

      const result = await controller.listAll();
      expect(result).toEqual(plans);
    });

    it('should update a plan', async () => {
      const updated = { id: 'plan-1', displayName: 'Updated' };
      (service.updatePlan as jest.Mock).mockResolvedValue(ServiceResult.ok(updated));

      const result = await controller.update('plan-1', { displayName: 'Updated' });
      expect(result).toEqual(updated);
    });

    it('should deactivate a plan', async () => {
      const deactivated = { id: 'plan-1', isActive: false };
      (service.deactivatePlan as jest.Mock).mockResolvedValue(ServiceResult.ok(deactivated));

      const result = await controller.deactivate('plan-1');
      expect(result).toEqual(deactivated);
    });
  });

  describe('TenantSubscriptionController', () => {
    let controller: TenantSubscriptionController;

    beforeEach(() => {
      controller = new TenantSubscriptionController(service as SubscriptionsService);
    });

    it('should get tenant subscription', async () => {
      const sub = { id: 'sub-1', plan: { name: 'starter' } };
      (service.getTenantSubscription as jest.Mock).mockResolvedValue(ServiceResult.ok(sub));

      const result = await controller.get('tenant-1');
      expect(result).toEqual(sub);
    });

    it('should throw when subscription not found', async () => {
      (service.getTenantSubscription as jest.Mock).mockResolvedValue(
        ServiceResult.fail('NOT_FOUND', 'Not found'),
      );

      await expect(controller.get('tenant-1')).rejects.toThrow(AppException);
    });

    it('should get usage summary', async () => {
      const usage = { plan: { name: 'starter' }, usage: { users: { current: 1, limit: 3 } } };
      (service.getUsageSummary as jest.Mock).mockResolvedValue(ServiceResult.ok(usage));

      const result = await controller.getUsage('tenant-1');
      expect(result).toEqual(usage);
    });
  });

  describe('PublicPlansController', () => {
    let controller: PublicPlansController;

    beforeEach(() => {
      controller = new PublicPlansController(service as SubscriptionsService);
    });

    it('should list available plans', async () => {
      const plans = [{ name: 'starter', isActive: true }];
      (service.listPlans as jest.Mock).mockResolvedValue(ServiceResult.ok(plans));

      const result = await controller.listAvailable();
      expect(result).toEqual(plans);
      expect(service.listPlans).toHaveBeenCalledWith(true);
    });
  });
});
