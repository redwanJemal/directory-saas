import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prisma: any;

  const tenantId = 'tenant-uuid-1';
  const profileId = 'profile-uuid-1';

  const mockProfile = {
    id: profileId,
    tenantId,
  };

  beforeEach(() => {
    prisma = {
      providerProfile: {
        findUnique: jest.fn().mockResolvedValue(mockProfile),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      profileView: {
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({}),
      },
      inquiry: {
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
      },
      booking: {
        count: jest.fn().mockResolvedValue(0),
        aggregate: jest.fn().mockResolvedValue({ _sum: { totalAmount: null } }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      review: {
        count: jest.fn().mockResolvedValue(0),
        aggregate: jest
          .fn()
          .mockResolvedValue({ _avg: { rating: null }, _count: { id: 0 } }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      contactClick: {
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      tenant: {
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
      },
      clientUser: {
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
      },
      verificationRequest: {
        count: jest.fn().mockResolvedValue(0),
      },
      providerCategory: {
        groupBy: jest.fn().mockResolvedValue([]),
      },
      category: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    service = new AnalyticsService(prisma);
  });

  describe('getProviderAnalytics', () => {
    it('should fail when tenantId is empty', async () => {
      const result = await service.getProviderAnalytics('', '30d');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('TENANT_REQUIRED');
    });

    it('should return empty analytics when profile not found', async () => {
      prisma.providerProfile.findUnique.mockResolvedValue(null);
      const result = await service.getProviderAnalytics(tenantId, '30d');
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        period: '30d',
        stats: {
          profileViews: 0,
          inquiries: 0,
          bookingRate: 0,
          revenue: 0,
        },
      });
    });

    it('should return analytics data with trends', async () => {
      prisma.profileView.count
        .mockResolvedValueOnce(100) // current period
        .mockResolvedValueOnce(80); // previous period
      prisma.inquiry.count
        .mockResolvedValueOnce(20)
        .mockResolvedValueOnce(15);
      prisma.booking.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(8)
        .mockResolvedValueOnce(8) // quoted bookings
        .mockResolvedValueOnce(5); // confirmed bookings
      prisma.booking.aggregate
        .mockResolvedValueOnce({ _sum: { totalAmount: 50000 } })
        .mockResolvedValueOnce({ _sum: { totalAmount: 40000 } });
      prisma.review.aggregate.mockResolvedValue({
        _avg: { rating: 4.5 },
        _count: { id: 10 },
      });
      prisma.review.findMany.mockResolvedValue([
        { rating: 5, response: 'thanks', createdAt: new Date() },
        { rating: 4, response: null, createdAt: new Date() },
        { rating: 3, response: 'noted', createdAt: new Date() },
      ]);
      prisma.contactClick.groupBy.mockResolvedValue([
        { type: 'whatsapp', _count: { id: 15 } },
        { type: 'phone', _count: { id: 8 } },
      ]);

      const result = await service.getProviderAnalytics(tenantId, '30d');
      expect(result.success).toBe(true);

      const data = result.data as any;
      expect(data.stats.profileViews).toBe(100);
      expect(data.stats.profileViewsTrend).toBe(25);
      expect(data.stats.inquiries).toBe(20);
      expect(data.stats.bookingRate).toBe(50);
      expect(data.stats.revenue).toBe(50000);
      expect(data.conversionFunnel).toBeDefined();
      expect(data.profileViewsChart).toBeDefined();
      expect(data.inquiriesChart).toBeDefined();
      expect(data.revenueChart).toBeDefined();

      // Review stats
      expect(data.reviewStats).toBeDefined();
      expect(data.reviewStats.totalReviews).toBe(3);
      expect(data.reviewStats.responseRate).toBe(67); // 2/3

      // Contact clicks by type
      expect(data.contactClicksByType).toBeDefined();
      expect(data.contactClicksByType.whatsapp).toBe(15);
      expect(data.contactClicksByType.phone).toBe(8);
    });

    it('should parse different period formats', async () => {
      prisma.providerProfile.findUnique.mockResolvedValue(null);

      const result7d = await service.getProviderAnalytics(tenantId, '7d');
      expect(result7d.success).toBe(true);
      expect((result7d.data as any).period).toBe('7d');

      const result12m = await service.getProviderAnalytics(tenantId, '12m');
      expect(result12m.success).toBe(true);
      expect((result12m.data as any).period).toBe('12m');
    });
  });

  describe('recordProfileView', () => {
    it('should fail when provider not found', async () => {
      prisma.providerProfile.findUnique.mockResolvedValue(null);
      const result = await service.recordProfileView('nonexistent');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });

    it('should record a profile view successfully', async () => {
      const result = await service.recordProfileView(profileId, {
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        referrer: 'https://google.com',
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ recorded: true });
      expect(prisma.profileView.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          providerProfileId: profileId,
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
          referrer: 'https://google.com',
        }),
      });
    });
  });

  describe('getAdminPlatformMetrics', () => {
    it('should return platform metrics', async () => {
      prisma.tenant.count.mockResolvedValue(50);
      prisma.clientUser.count.mockResolvedValue(200);
      prisma.review.count.mockResolvedValue(100);
      prisma.providerProfile.count.mockResolvedValue(30);
      prisma.verificationRequest.count
        .mockResolvedValueOnce(5) // pending
        .mockResolvedValueOnce(20) // total
        .mockResolvedValueOnce(15); // approved

      const result = await service.getAdminPlatformMetrics(30);
      expect(result.success).toBe(true);

      const data = result.data as any;
      expect(data.period).toBe('30d');
      expect(data.stats).toBeDefined();
      expect(data.stats.totalBusinesses).toBe(50);
      expect(data.stats.totalClients).toBe(200);
      expect(data.stats.totalReviews).toBe(100);
      expect(data.stats.verificationRate).toBe(75);
      expect(data.userGrowthChart).toBeDefined();
      expect(data.businessGrowthChart).toBeDefined();
      expect(data.topCategories).toBeDefined();
      expect(data.topBusinessesByClicks).toBeDefined();
    });

    it('should handle zero verification requests', async () => {
      prisma.verificationRequest.count.mockResolvedValue(0);

      const result = await service.getAdminPlatformMetrics(7);
      expect(result.success).toBe(true);
      expect((result.data as any).stats.verificationRate).toBe(0);
    });
  });
});
