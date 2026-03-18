import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ServiceResult } from '../../common/types';

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(): Promise<ServiceResult<unknown>> {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [
      totalBusinesses,
      pendingVerifications,
      newThisWeek,
      totalReviews,
      verifiedBusinesses,
      totalContactClicks,
    ] = await Promise.all([
      this.prisma.tenant.count({ where: { deletedAt: null } }),
      this.prisma.verificationRequest.count({ where: { status: 'pending' } }),
      this.prisma.tenant.count({
        where: { deletedAt: null, createdAt: { gte: weekAgo } },
      }),
      this.prisma.review.count(),
      this.prisma.providerProfile.count({ where: { isVerified: true } }),
      this.prisma.contactClick.count({
        where: { createdAt: { gte: weekAgo } },
      }),
    ]);

    return ServiceResult.ok({
      totalBusinesses,
      pendingVerifications,
      newThisWeek,
      totalReviews,
      verifiedBusinesses,
      totalContactClicks,
    });
  }

  async getBusinessesOverTime(
    days: number = 30,
  ): Promise<ServiceResult<unknown>> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const tenants = await this.prisma.tenant.findMany({
      where: {
        deletedAt: null,
        createdAt: { gte: since },
      },
      select: {
        createdAt: true,
        providerProfile: {
          select: { country: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date and country
    const dailyMap = new Map<
      string,
      { total: number; byCountry: Record<string, number> }
    >();

    for (const tenant of tenants) {
      const dateKey = tenant.createdAt.toISOString().split('T')[0];
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, { total: 0, byCountry: {} });
      }
      const day = dailyMap.get(dateKey)!;
      day.total++;
      const country = tenant.providerProfile?.country || 'unknown';
      day.byCountry[country] = (day.byCountry[country] || 0) + 1;
    }

    const daily = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));

    return ServiceResult.ok({ period: `${days}d`, daily });
  }

  async getContactClicksByType(
    days: number = 30,
  ): Promise<ServiceResult<unknown>> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const clicks = await this.prisma.contactClick.groupBy({
      by: ['type'],
      where: { createdAt: { gte: since } },
      _count: { id: true },
    });

    const byType: Record<string, number> = {};
    for (const click of clicks) {
      byType[click.type] = click._count.id;
    }

    const total = Object.values(byType).reduce((sum, c) => sum + c, 0);

    return ServiceResult.ok({ period: `${days}d`, total, byType });
  }
}
