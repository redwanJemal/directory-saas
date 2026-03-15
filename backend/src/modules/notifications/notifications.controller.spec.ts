import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { ServiceResult } from '../../common/types';
import { Reflector } from '@nestjs/core';

const makeNotification = (overrides = {}) => ({
  id: 'notif-1',
  tenantId: 'tenant-1',
  userId: 'user-1',
  userType: 'TenantUser',
  type: 'info',
  title: 'Test Notification',
  message: 'This is a test',
  data: null,
  readAt: null,
  createdAt: new Date('2026-03-15T10:00:00Z'),
  ...overrides,
});

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let serviceMock: Record<string, jest.Mock>;

  beforeEach(async () => {
    serviceMock = {
      findAll: jest.fn(),
      markRead: jest.fn(),
      markAllRead: jest.fn(),
      getUnreadCount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        { provide: NotificationsService, useValue: serviceMock },
        Reflector,
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
  });

  describe('findAll', () => {
    it('should return paginated notifications', async () => {
      const data = {
        items: [makeNotification()],
        pagination: { page: 1, pageSize: 20, totalCount: 1, totalPages: 1 },
      };
      serviceMock.findAll.mockResolvedValue(ServiceResult.ok(data));

      const result = await controller.findAll('user-1', 'TenantUser', {
        page: 1,
        pageSize: 20,
      });

      expect(result).toEqual(data);
      expect(serviceMock.findAll).toHaveBeenCalledWith(
        'user-1',
        'TenantUser',
        { page: 1, pageSize: 20 },
      );
    });

    it('should throw on service failure', async () => {
      serviceMock.findAll.mockResolvedValue(
        ServiceResult.fail('INTERNAL_ERROR', 'Failed'),
      );

      await expect(
        controller.findAll('user-1', 'TenantUser', { page: 1, pageSize: 20 }),
      ).rejects.toThrow();
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      serviceMock.getUnreadCount.mockResolvedValue(
        ServiceResult.ok({ count: 5 }),
      );

      const result = await controller.getUnreadCount('user-1', 'TenantUser');

      expect(result).toEqual({ count: 5 });
    });
  });

  describe('markRead', () => {
    it('should mark notification as read', async () => {
      const updated = makeNotification({ readAt: new Date() });
      serviceMock.markRead.mockResolvedValue(ServiceResult.ok(updated));

      const result = await controller.markRead(
        'user-1',
        'TenantUser',
        'notif-1',
      );

      expect(result!.readAt).toBeTruthy();
    });

    it('should throw when notification not found', async () => {
      serviceMock.markRead.mockResolvedValue(
        ServiceResult.fail('NOT_FOUND', 'Notification not found'),
      );

      await expect(
        controller.markRead('user-1', 'TenantUser', 'notif-999'),
      ).rejects.toThrow();
    });
  });

  describe('markAllRead', () => {
    it('should mark all as read and return count', async () => {
      serviceMock.markAllRead.mockResolvedValue(
        ServiceResult.ok({ count: 3 }),
      );

      const result = await controller.markAllRead('user-1', 'TenantUser');

      expect(result).toEqual({ count: 3 });
    });
  });
});
