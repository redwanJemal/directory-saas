import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ServiceResult } from '../../common/types';
import { ErrorCodes } from '../../common/constants/error-codes';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSetting(
    userId: string,
    userType: string,
    key: string,
  ): Promise<ServiceResult<unknown>> {
    const setting = await this.prisma.userSetting.findUnique({
      where: { userId_userType_key: { userId, userType, key } },
    });

    if (!setting) {
      return ServiceResult.ok(null);
    }

    return ServiceResult.ok(setting.value);
  }

  async updateSetting(
    userId: string,
    userType: string,
    key: string,
    value: unknown,
  ): Promise<ServiceResult<unknown>> {
    const setting = await this.prisma.userSetting.upsert({
      where: { userId_userType_key: { userId, userType, key } },
      update: { value: value as object },
      create: {
        userId,
        userType,
        key,
        value: value as object,
      },
    });

    return ServiceResult.ok(setting.value);
  }

  async getBusinessHours(tenantId: string): Promise<ServiceResult<unknown>> {
    // Business hours are stored as a tenant-user setting with key 'business-hours'
    // using tenantId as userId for tenant-level settings
    return this.getSetting(tenantId, 'tenant', 'business-hours');
  }

  async updateBusinessHours(
    tenantId: string,
    value: unknown,
  ): Promise<ServiceResult<unknown>> {
    return this.updateSetting(tenantId, 'tenant', 'business-hours', value);
  }

  async getNotificationPrefs(
    userId: string,
    userType: string,
  ): Promise<ServiceResult<unknown>> {
    return this.getSetting(userId, userType, 'notifications');
  }

  async updateNotificationPrefs(
    userId: string,
    userType: string,
    value: unknown,
  ): Promise<ServiceResult<unknown>> {
    return this.updateSetting(userId, userType, 'notifications', value);
  }
}
