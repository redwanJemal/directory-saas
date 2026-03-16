import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ServiceResult } from '../../common/types';
import { ErrorCodes } from '../../common/constants/error-codes';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getProviderAnalytics(
    tenantId: string,
    period: string,
  ): Promise<ServiceResult<unknown>> {
    if (!tenantId) {
      return ServiceResult.fail(
        ErrorCodes.TENANT_REQUIRED,
        'Tenant ID is required for provider analytics',
      );
    }

    const days = this.parsePeriod(period);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [totalBookings, reviews, inquiryCount] = await Promise.all([
      this.prisma.booking.count({
        where: {
          tenantId,
          createdAt: { gte: since },
        },
      }),
      this.prisma.review.aggregate({
        where: {
          tenantId,
          createdAt: { gte: since },
        },
        _avg: { rating: true },
        _count: { id: true },
      }),
      this.prisma.inquiry.count({
        where: {
          tenantId,
          createdAt: { gte: since },
        },
      }),
    ]);

    // Compute total revenue from bookings with totalPrice
    const revenueResult = await this.prisma.booking.aggregate({
      where: {
        tenantId,
        createdAt: { gte: since },
      },
      _sum: { totalAmount: true },
    });

    const totalRevenue = Number(revenueResult._sum.totalAmount ?? 0);
    const averageRating = reviews._avg.rating
      ? Number(reviews._avg.rating)
      : 0;
    const reviewCount = reviews._count.id;

    return ServiceResult.ok({
      period,
      days,
      totalBookings,
      totalRevenue,
      averageRating: Math.round(averageRating * 100) / 100,
      reviewCount,
      inquiryCount,
      trends: {
        bookings: 0,
        revenue: 0,
        rating: 0,
        reviews: 0,
        inquiries: 0,
      },
    });
  }

  private parsePeriod(period: string): number {
    const match = period.match(/^(\d+)d$/);
    if (match) {
      return Math.min(365, Math.max(1, parseInt(match[1], 10)));
    }
    return 30; // default 30 days
  }
}
