import { Injectable, Logger } from '@nestjs/common';
import { Notification, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ServiceResult } from '../../common/types';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';

export interface PaginatedNotifications {
  items: Notification[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateNotificationDto,
  ): Promise<ServiceResult<Notification>> {
    try {
      const notification = await this.prisma.notification.create({
        data: {
          tenantId: dto.tenantId,
          userId: dto.userId,
          userType: dto.userType,
          type: dto.type,
          title: dto.title,
          message: dto.message,
          data: (dto.data as Prisma.InputJsonValue) ?? undefined,
        },
      });
      return ServiceResult.ok(notification);
    } catch (error) {
      this.logger.error(`Failed to create notification: ${(error as Error).message}`);
      return ServiceResult.fail('INTERNAL_ERROR', 'Failed to create notification');
    }
  }

  async findAll(
    userId: string,
    userType: string,
    query: NotificationQueryDto,
  ): Promise<ServiceResult<PaginatedNotifications>> {
    const { page, pageSize, read, type } = query;
    const skip = (page - 1) * pageSize;

    const where: Prisma.NotificationWhereInput = {
      userId,
      userType,
    };

    if (read === 'true') {
      where.readAt = { not: null };
    } else if (read === 'false') {
      where.readAt = null;
    }

    if (type) {
      where.type = type;
    }

    try {
      const [items, totalCount] = await Promise.all([
        this.prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize,
        }),
        this.prisma.notification.count({ where }),
      ]);

      return ServiceResult.ok({
        items,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / pageSize),
        },
      });
    } catch (error) {
      this.logger.error(`Failed to list notifications: ${(error as Error).message}`);
      return ServiceResult.fail('INTERNAL_ERROR', 'Failed to list notifications');
    }
  }

  async markRead(
    userId: string,
    userType: string,
    notificationId: string,
  ): Promise<ServiceResult<Notification>> {
    try {
      const notification = await this.prisma.notification.findFirst({
        where: { id: notificationId, userId, userType },
      });

      if (!notification) {
        return ServiceResult.fail('NOT_FOUND', 'Notification not found');
      }

      const updated = await this.prisma.notification.update({
        where: { id: notificationId },
        data: { readAt: new Date() },
      });

      return ServiceResult.ok(updated);
    } catch (error) {
      this.logger.error(`Failed to mark notification read: ${(error as Error).message}`);
      return ServiceResult.fail('INTERNAL_ERROR', 'Failed to mark notification as read');
    }
  }

  async markAllRead(
    userId: string,
    userType: string,
  ): Promise<ServiceResult<{ count: number }>> {
    try {
      const result = await this.prisma.notification.updateMany({
        where: { userId, userType, readAt: null },
        data: { readAt: new Date() },
      });

      return ServiceResult.ok({ count: result.count });
    } catch (error) {
      this.logger.error(`Failed to mark all read: ${(error as Error).message}`);
      return ServiceResult.fail('INTERNAL_ERROR', 'Failed to mark all notifications as read');
    }
  }

  async getUnreadCount(
    userId: string,
    userType: string,
  ): Promise<ServiceResult<{ count: number }>> {
    try {
      const count = await this.prisma.notification.count({
        where: { userId, userType, readAt: null },
      });

      return ServiceResult.ok({ count });
    } catch (error) {
      this.logger.error(`Failed to get unread count: ${(error as Error).message}`);
      return ServiceResult.fail('INTERNAL_ERROR', 'Failed to get unread count');
    }
  }
}
