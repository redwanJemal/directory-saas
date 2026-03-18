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

    const profile = await this.prisma.providerProfile.findUnique({
      where: { tenantId },
    });

    if (!profile) {
      return ServiceResult.ok(this.emptyAnalytics(period));
    }

    const days = this.parsePeriod(period);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const prevSince = new Date(Date.now() - days * 2 * 24 * 60 * 60 * 1000);

    // Current period stats
    const [
      profileViews,
      prevProfileViews,
      inquiries,
      prevInquiries,
      bookings,
      prevBookings,
      revenue,
      prevRevenue,
      reviews,
    ] = await Promise.all([
      this.prisma.profileView.count({
        where: { providerProfileId: profile.id, createdAt: { gte: since } },
      }),
      this.prisma.profileView.count({
        where: {
          providerProfileId: profile.id,
          createdAt: { gte: prevSince, lt: since },
        },
      }),
      this.prisma.inquiry.count({
        where: { tenantId, createdAt: { gte: since } },
      }),
      this.prisma.inquiry.count({
        where: { tenantId, createdAt: { gte: prevSince, lt: since } },
      }),
      this.prisma.booking.count({
        where: { tenantId, createdAt: { gte: since } },
      }),
      this.prisma.booking.count({
        where: { tenantId, createdAt: { gte: prevSince, lt: since } },
      }),
      this.prisma.booking.aggregate({
        where: { tenantId, createdAt: { gte: since } },
        _sum: { totalAmount: true },
      }),
      this.prisma.booking.aggregate({
        where: { tenantId, createdAt: { gte: prevSince, lt: since } },
        _sum: { totalAmount: true },
      }),
      this.prisma.review.aggregate({
        where: { tenantId, createdAt: { gte: since } },
        _avg: { rating: true },
        _count: { id: true },
      }),
    ]);

    const totalRevenue = Number(revenue._sum.totalAmount ?? 0);
    const prevTotalRevenue = Number(prevRevenue._sum.totalAmount ?? 0);
    const bookingRate =
      inquiries > 0 ? Math.round((bookings / inquiries) * 100) : 0;
    const prevBookingRate =
      prevInquiries > 0
        ? Math.round((prevBookings / prevInquiries) * 100)
        : 0;

    // Chart data: daily profile views and inquiries
    const [viewsRaw, inquiriesRaw, bookingsRaw] = await Promise.all([
      this.prisma.profileView.findMany({
        where: { providerProfileId: profile.id, createdAt: { gte: since } },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.inquiry.findMany({
        where: { tenantId, createdAt: { gte: since } },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.booking.findMany({
        where: { tenantId, createdAt: { gte: since } },
        select: { createdAt: true, totalAmount: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const profileViewsChart = this.groupByDate(
      viewsRaw.map((v) => v.createdAt),
      since,
      days,
    );
    const inquiriesChart = this.groupByDate(
      inquiriesRaw.map((v) => v.createdAt),
      since,
      days,
    );
    const revenueChart = this.groupByDateWithSum(
      bookingsRaw.map((b) => ({
        date: b.createdAt,
        value: Number(b.totalAmount ?? 0),
      })),
      since,
      days,
    );

    // Conversion funnel, review stats, contact clicks
    const [
      quotedBookings,
      confirmedBookings,
      allReviews,
      contactClicksByType,
    ] = await Promise.all([
      this.prisma.booking.count({
        where: {
          tenantId,
          createdAt: { gte: since },
          totalAmount: { not: null },
        },
      }),
      this.prisma.booking.count({
        where: {
          tenantId,
          createdAt: { gte: since },
          status: { in: ['CONFIRMED', 'COMPLETED'] },
        },
      }),
      this.prisma.review.findMany({
        where: { tenantId },
        select: { rating: true, response: true, createdAt: true },
      }),
      this.prisma.contactClick.groupBy({
        by: ['type'],
        where: { providerProfileId: profile.id, createdAt: { gte: since } },
        _count: { id: true },
      }),
    ]);

    // Review stats
    const totalReviews = allReviews.length;
    const respondedReviews = allReviews.filter((r) => r.response).length;
    const responseRate =
      totalReviews > 0
        ? Math.round((respondedReviews / totalReviews) * 100)
        : 0;
    const averageRating =
      totalReviews > 0
        ? Math.round(
            (allReviews.reduce((sum, r) => sum + r.rating, 0) /
              totalReviews) *
              100,
          ) / 100
        : 0;
    const currentPeriodReviews = allReviews.filter(
      (r) => r.createdAt >= since,
    );
    const previousPeriodReviews = allReviews.filter(
      (r) => r.createdAt >= prevSince && r.createdAt < since,
    );
    const currentAvgRating =
      currentPeriodReviews.length > 0
        ? currentPeriodReviews.reduce((s, r) => s + r.rating, 0) /
          currentPeriodReviews.length
        : 0;
    const previousAvgRating =
      previousPeriodReviews.length > 0
        ? previousPeriodReviews.reduce((s, r) => s + r.rating, 0) /
          previousPeriodReviews.length
        : 0;
    const ratingTrend = this.calcTrend(currentAvgRating, previousAvgRating);

    // Contact clicks by type
    const clicksByType: Record<string, number> = {};
    for (const click of contactClicksByType) {
      clicksByType[click.type] = click._count.id;
    }

    return ServiceResult.ok({
      period,
      stats: {
        profileViews,
        profileViewsTrend: this.calcTrend(profileViews, prevProfileViews),
        inquiries,
        inquiriesTrend: this.calcTrend(inquiries, prevInquiries),
        bookingRate,
        bookingRateTrend: bookingRate - prevBookingRate,
        revenue: totalRevenue,
        revenueTrend: this.calcTrend(totalRevenue, prevTotalRevenue),
      },
      profileViewsChart,
      inquiriesChart,
      revenueChart,
      conversionFunnel: {
        views: profileViews,
        inquiries,
        quotes: quotedBookings,
        bookings: confirmedBookings,
      },
      reviewStats: {
        averageRating,
        totalReviews,
        responseRate,
        ratingTrend,
      },
      contactClicksByType: clicksByType,
    });
  }

  async recordProfileView(
    providerProfileId: string,
    options?: {
      clientUserId?: string;
      ipAddress?: string;
      userAgent?: string;
      referrer?: string;
    },
  ): Promise<ServiceResult<{ recorded: boolean }>> {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { id: providerProfileId },
    });

    if (!profile) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Provider not found');
    }

    // Fire and forget for performance
    this.prisma.profileView
      .create({
        data: {
          providerProfileId,
          clientUserId: options?.clientUserId || null,
          ipAddress: options?.ipAddress || null,
          userAgent: options?.userAgent || null,
          referrer: options?.referrer || null,
        },
      })
      .catch(() => {
        // Silently ignore — analytics should not block the response
      });

    return ServiceResult.ok({ recorded: true });
  }

  async getAdminPlatformMetrics(
    days: number = 30,
  ): Promise<ServiceResult<unknown>> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const prevSince = new Date(Date.now() - days * 2 * 24 * 60 * 60 * 1000);

    const [
      totalBusinesses,
      newBusinesses,
      prevNewBusinesses,
      totalClients,
      newClients,
      prevNewClients,
      totalReviews,
      verifiedBusinesses,
      pendingVerifications,
      totalVerificationRequests,
      approvedVerifications,
      contactClicks,
    ] = await Promise.all([
      this.prisma.tenant.count({ where: { deletedAt: null } }),
      this.prisma.tenant.count({
        where: { deletedAt: null, createdAt: { gte: since } },
      }),
      this.prisma.tenant.count({
        where: {
          deletedAt: null,
          createdAt: { gte: prevSince, lt: since },
        },
      }),
      this.prisma.clientUser.count({ where: { deletedAt: null } }),
      this.prisma.clientUser.count({
        where: { deletedAt: null, createdAt: { gte: since } },
      }),
      this.prisma.clientUser.count({
        where: {
          deletedAt: null,
          createdAt: { gte: prevSince, lt: since },
        },
      }),
      this.prisma.review.count(),
      this.prisma.providerProfile.count({ where: { isVerified: true } }),
      this.prisma.verificationRequest.count({
        where: { status: 'pending' },
      }),
      this.prisma.verificationRequest.count(),
      this.prisma.verificationRequest.count({
        where: { status: 'approved' },
      }),
      this.prisma.contactClick.count({
        where: { createdAt: { gte: since } },
      }),
    ]);

    // User growth chart
    const clientsRaw = await this.prisma.clientUser.findMany({
      where: { deletedAt: null, createdAt: { gte: since } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    const userGrowthChart = this.groupByDate(
      clientsRaw.map((c) => c.createdAt),
      since,
      days,
    );

    // Businesses over time
    const tenantsRaw = await this.prisma.tenant.findMany({
      where: { deletedAt: null, createdAt: { gte: since } },
      select: {
        createdAt: true,
        providerProfile: { select: { country: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    const businessGrowthChart = this.groupByDate(
      tenantsRaw.map((t) => t.createdAt),
      since,
      days,
    );

    // Businesses by country
    const businessesByCountry: Record<string, number> = {};
    for (const t of tenantsRaw) {
      const country = t.providerProfile?.country || 'unknown';
      businessesByCountry[country] =
        (businessesByCountry[country] || 0) + 1;
    }

    // Most active categories
    const categoryStats = await this.prisma.providerCategory.groupBy({
      by: ['categoryId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });
    const categoryIds = categoryStats.map((c) => c.categoryId);
    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    });
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
    const topCategories = categoryStats.map((c) => ({
      name: categoryMap.get(c.categoryId) || 'Unknown',
      count: c._count.id,
    }));

    // Top businesses by contact clicks
    const topBusinessClicks = await this.prisma.contactClick.groupBy({
      by: ['providerProfileId'],
      where: { createdAt: { gte: since } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });
    const topProfileIds = topBusinessClicks.map(
      (c) => c.providerProfileId,
    );
    const topProfiles = await this.prisma.providerProfile.findMany({
      where: { id: { in: topProfileIds } },
      select: {
        id: true,
        tenant: { select: { name: true } },
      },
    });
    const profileNameMap = new Map(
      topProfiles.map((p) => [p.id, p.tenant.name]),
    );
    const topBusinessesByClicks = topBusinessClicks.map((c) => ({
      name: profileNameMap.get(c.providerProfileId) || 'Unknown',
      clicks: c._count.id,
    }));

    const verificationRate =
      totalVerificationRequests > 0
        ? Math.round(
            (approvedVerifications / totalVerificationRequests) * 100,
          )
        : 0;

    return ServiceResult.ok({
      period: `${days}d`,
      stats: {
        totalBusinesses,
        newBusinesses,
        newBusinessesTrend: this.calcTrend(newBusinesses, prevNewBusinesses),
        totalClients,
        newClients,
        newClientsTrend: this.calcTrend(newClients, prevNewClients),
        totalReviews,
        verifiedBusinesses,
        pendingVerifications,
        contactClicks,
        verificationRate,
      },
      userGrowthChart,
      businessGrowthChart,
      businessesByCountry,
      topCategories,
      topBusinessesByClicks,
    });
  }

  private parsePeriod(period: string): number {
    const matchDays = period.match(/^(\d+)d$/);
    if (matchDays) {
      return Math.min(365, Math.max(1, parseInt(matchDays[1], 10)));
    }
    const matchMonths = period.match(/^(\d+)m$/);
    if (matchMonths) {
      return Math.min(365, parseInt(matchMonths[1], 10) * 30);
    }
    return 30;
  }

  private calcTrend(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100 * 10) / 10;
  }

  private groupByDate(
    dates: Date[],
    since: Date,
    days: number,
  ): { date: string; value: number }[] {
    const map = new Map<string, number>();
    // Initialize all days
    for (let i = 0; i < days; i++) {
      const d = new Date(since.getTime() + i * 24 * 60 * 60 * 1000);
      map.set(d.toISOString().split('T')[0], 0);
    }
    for (const date of dates) {
      const key = date.toISOString().split('T')[0];
      map.set(key, (map.get(key) || 0) + 1);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({ date, value }));
  }

  private groupByDateWithSum(
    items: { date: Date; value: number }[],
    since: Date,
    days: number,
  ): { date: string; value: number }[] {
    const map = new Map<string, number>();
    for (let i = 0; i < days; i++) {
      const d = new Date(since.getTime() + i * 24 * 60 * 60 * 1000);
      map.set(d.toISOString().split('T')[0], 0);
    }
    for (const item of items) {
      const key = item.date.toISOString().split('T')[0];
      map.set(key, (map.get(key) || 0) + item.value);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({ date, value }));
  }

  private emptyAnalytics(period: string) {
    return {
      period,
      stats: {
        profileViews: 0,
        profileViewsTrend: 0,
        inquiries: 0,
        inquiriesTrend: 0,
        bookingRate: 0,
        bookingRateTrend: 0,
        revenue: 0,
        revenueTrend: 0,
      },
      profileViewsChart: [],
      inquiriesChart: [],
      revenueChart: [],
      conversionFunnel: {
        views: 0,
        inquiries: 0,
        quotes: 0,
        bookings: 0,
      },
      reviewStats: {
        averageRating: 0,
        totalReviews: 0,
        responseRate: 0,
        ratingTrend: 0,
      },
      contactClicksByType: {},
    };
  }
}
