import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../prisma/prisma.service';

const makeNotification = (overrides = {}) => ({
  id: 'notif-1',
  tenantId: 'tenant-1',
  userId: 'user-1',
  userType: 'TenantUser',
  type: 'info',
  title: 'Test Notification',
  message: 'This is a test notification',
  data: null,
  readAt: null,
  createdAt: new Date('2026-03-15T10:00:00Z'),
  ...overrides,
});

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prismaMock: Record<string, Record<string, jest.Mock>>;

  beforeEach(async () => {
    prismaMock = {
      notification: {
        create: jest.fn().mockResolvedValue(makeNotification()),
        findMany: jest.fn().mockResolvedValue([makeNotification()]),
        findFirst: jest.fn().mockResolvedValue(makeNotification()),
        count: jest.fn().mockResolvedValue(1),
        update: jest.fn().mockResolvedValue(
          makeNotification({ readAt: new Date() }),
        ),
        updateMany: jest.fn().mockResolvedValue({ count: 3 }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('create', () => {
    it('should create a notification', async () => {
      const result = await service.create({
        tenantId: 'tenant-1',
        userId: 'user-1',
        userType: 'TenantUser',
        type: 'info',
        title: 'Test',
        message: 'Test message',
      });

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('notif-1');
      expect(prismaMock.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          userType: 'TenantUser',
          type: 'info',
        }),
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated notifications for a user', async () => {
      const result = await service.findAll('user-1', 'TenantUser', {
        page: 1,
        pageSize: 20,
      });

      expect(result.success).toBe(true);
      expect(result.data?.items).toHaveLength(1);
      expect(result.data?.pagination.totalCount).toBe(1);
      expect(prismaMock.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1', userType: 'TenantUser' },
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('should filter by read status', async () => {
      await service.findAll('user-1', 'TenantUser', {
        page: 1,
        pageSize: 20,
        read: 'false',
      });

      expect(prismaMock.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1', userType: 'TenantUser', readAt: null },
        }),
      );
    });

    it('should filter by read=true', async () => {
      await service.findAll('user-1', 'TenantUser', {
        page: 1,
        pageSize: 20,
        read: 'true',
      });

      expect(prismaMock.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 'user-1',
            userType: 'TenantUser',
            readAt: { not: null },
          },
        }),
      );
    });

    it('should filter by notification type', async () => {
      await service.findAll('user-1', 'TenantUser', {
        page: 1,
        pageSize: 20,
        type: 'warning',
      });

      expect(prismaMock.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 'user-1',
            userType: 'TenantUser',
            type: 'warning',
          },
        }),
      );
    });
  });

  describe('markRead', () => {
    it('should mark a notification as read', async () => {
      const result = await service.markRead('user-1', 'TenantUser', 'notif-1');

      expect(result.success).toBe(true);
      expect(result.data?.readAt).toBeTruthy();
      expect(prismaMock.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: { readAt: expect.any(Date) },
      });
    });

    it('should return NOT_FOUND if notification does not belong to user', async () => {
      prismaMock.notification.findFirst.mockResolvedValue(null);

      const result = await service.markRead('user-1', 'TenantUser', 'notif-999');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });
  });

  describe('markAllRead', () => {
    it('should mark all unread notifications as read', async () => {
      const result = await service.markAllRead('user-1', 'TenantUser');

      expect(result.success).toBe(true);
      expect(result.data?.count).toBe(3);
      expect(prismaMock.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', userType: 'TenantUser', readAt: null },
        data: { readAt: expect.any(Date) },
      });
    });
  });

  describe('getUnreadCount', () => {
    it('should return count of unread notifications', async () => {
      prismaMock.notification.count.mockResolvedValue(5);

      const result = await service.getUnreadCount('user-1', 'TenantUser');

      expect(result.success).toBe(true);
      expect(result.data?.count).toBe(5);
      expect(prismaMock.notification.count).toHaveBeenCalledWith({
        where: { userId: 'user-1', userType: 'TenantUser', readAt: null },
      });
    });
  });

  describe('scoping', () => {
    it('should always scope queries to userId and userType', async () => {
      await service.findAll('user-1', 'TenantUser', { page: 1, pageSize: 20 });
      await service.markRead('user-1', 'TenantUser', 'notif-1');
      await service.markAllRead('user-1', 'TenantUser');
      await service.getUnreadCount('user-1', 'TenantUser');

      for (const call of prismaMock.notification.findMany.mock.calls) {
        expect(call[0].where).toMatchObject({
          userId: 'user-1',
          userType: 'TenantUser',
        });
      }

      expect(prismaMock.notification.findFirst).toHaveBeenCalledWith({
        where: { id: 'notif-1', userId: 'user-1', userType: 'TenantUser' },
      });
    });
  });
});
