import { DealsService } from './deals.service';

describe('DealsService', () => {
  let service: DealsService;
  let prisma: any;

  const tenantId = 'tenant-uuid-1';
  const profileId = 'profile-uuid-1';
  const dealId = 'deal-uuid-1';

  const mockProfile = {
    id: profileId,
    tenantId,
  };

  const mockDeal = {
    id: dealId,
    providerProfileId: profileId,
    title: 'Test Deal',
    description: 'A great deal',
    discountPercent: 20,
    originalPrice: 100,
    dealPrice: 80,
    imageUrl: null,
    isActive: true,
    startsAt: null,
    expiresAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    prisma = {
      providerProfile: {
        findUnique: jest.fn().mockResolvedValue(mockProfile),
        create: jest.fn().mockResolvedValue(mockProfile),
      },
      deal: {
        findMany: jest.fn().mockResolvedValue([mockDeal]),
        findFirst: jest.fn().mockResolvedValue(mockDeal),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockDeal),
        update: jest.fn().mockResolvedValue(mockDeal),
        updateMany: jest.fn().mockResolvedValue({ count: 3 }),
      },
      category: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    service = new DealsService(prisma);
  });

  // === Provider CRUD ===

  describe('listProviderDeals', () => {
    it('should return paginated deals for provider', async () => {
      const result = await service.listProviderDeals(tenantId, 1, 20);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.items).toHaveLength(1);
      expect(result.data!.total).toBe(1);
      expect(prisma.deal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { providerProfileId: profileId },
          skip: 0,
          take: 20,
        }),
      );
    });

    it('should return empty list when no profile exists', async () => {
      prisma.providerProfile.findUnique.mockResolvedValue(null);

      const result = await service.listProviderDeals(tenantId, 1, 20);

      expect(result.success).toBe(true);
      expect(result.data!.items).toHaveLength(0);
      expect(result.data!.total).toBe(0);
    });
  });

  describe('createDeal', () => {
    it('should create a deal successfully', async () => {
      const dto = {
        title: 'New Deal',
        description: 'Great savings',
        discountPercent: 15,
      };

      const result = await service.createDeal(tenantId, dto);

      expect(result.success).toBe(true);
      expect(prisma.deal.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          providerProfileId: profileId,
          title: 'New Deal',
          description: 'Great savings',
          discountPercent: 15,
        }),
      });
    });

    it('should create profile if it does not exist', async () => {
      prisma.providerProfile.findUnique.mockResolvedValue(null);

      const dto = { title: 'New Deal' };
      const result = await service.createDeal(tenantId, dto);

      expect(result.success).toBe(true);
      expect(prisma.providerProfile.create).toHaveBeenCalledWith({
        data: { tenantId },
      });
    });

    it('should convert date strings to Date objects', async () => {
      const dto = {
        title: 'Timed Deal',
        startsAt: '2026-03-01T00:00:00Z',
        expiresAt: '2026-04-01T00:00:00Z',
      };

      await service.createDeal(tenantId, dto);

      expect(prisma.deal.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          startsAt: new Date('2026-03-01T00:00:00Z'),
          expiresAt: new Date('2026-04-01T00:00:00Z'),
        }),
      });
    });
  });

  describe('updateDeal', () => {
    it('should update a deal successfully', async () => {
      const dto = { title: 'Updated Deal' };

      const result = await service.updateDeal(tenantId, dealId, dto);

      expect(result.success).toBe(true);
      expect(prisma.deal.update).toHaveBeenCalledWith({
        where: { id: dealId },
        data: expect.objectContaining({ title: 'Updated Deal' }),
      });
    });

    it('should fail when profile not found', async () => {
      prisma.providerProfile.findUnique.mockResolvedValue(null);

      const result = await service.updateDeal(tenantId, dealId, { title: 'x' });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });

    it('should fail when deal not found', async () => {
      prisma.deal.findFirst.mockResolvedValue(null);

      const result = await service.updateDeal(tenantId, dealId, { title: 'x' });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });

    it('should allow toggling isActive', async () => {
      const dto = { isActive: false };

      await service.updateDeal(tenantId, dealId, dto);

      expect(prisma.deal.update).toHaveBeenCalledWith({
        where: { id: dealId },
        data: expect.objectContaining({ isActive: false }),
      });
    });
  });

  describe('deleteDeal', () => {
    it('should soft-delete a deal by setting isActive=false', async () => {
      const result = await service.deleteDeal(tenantId, dealId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ deleted: true });
      expect(prisma.deal.update).toHaveBeenCalledWith({
        where: { id: dealId },
        data: { isActive: false },
      });
    });

    it('should fail when profile not found', async () => {
      prisma.providerProfile.findUnique.mockResolvedValue(null);

      const result = await service.deleteDeal(tenantId, dealId);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });

    it('should fail when deal not found', async () => {
      prisma.deal.findFirst.mockResolvedValue(null);

      const result = await service.deleteDeal(tenantId, dealId);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });
  });

  // === Public Endpoints ===

  describe('listActiveDeals', () => {
    it('should return paginated active deals', async () => {
      prisma.deal.findMany.mockResolvedValue([
        {
          ...mockDeal,
          providerProfile: {
            id: profileId,
            bio: 'Test business',
            city: 'Dubai',
            country: 'AE',
            coverImageUrl: null,
            isVerified: true,
            tenant: { id: 't1', name: 'Test Biz', slug: 'test-biz' },
          },
        },
      ]);

      const result = await service.listActiveDeals({ page: 1, pageSize: 20 });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(prisma.deal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        }),
      );
    });

    it('should filter by country', async () => {
      prisma.deal.findMany.mockResolvedValue([]);
      prisma.deal.count.mockResolvedValue(0);

      await service.listActiveDeals({ country: 'AE' });

      expect(prisma.deal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            providerProfile: expect.objectContaining({
              country: { equals: 'AE', mode: 'insensitive' },
            }),
          }),
        }),
      );
    });

    it('should filter by city', async () => {
      prisma.deal.findMany.mockResolvedValue([]);
      prisma.deal.count.mockResolvedValue(0);

      await service.listActiveDeals({ city: 'Dubai' });

      expect(prisma.deal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            providerProfile: expect.objectContaining({
              city: { equals: 'Dubai', mode: 'insensitive' },
            }),
          }),
        }),
      );
    });

    it('should filter by category', async () => {
      prisma.category.findMany.mockResolvedValue([
        { id: 'cat-1', slug: 'food', children: [{ id: 'cat-2' }] },
      ]);
      prisma.deal.findMany.mockResolvedValue([]);
      prisma.deal.count.mockResolvedValue(0);

      await service.listActiveDeals({ category: 'food' });

      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { slug: { in: ['food'] }, isActive: true },
        }),
      );
      expect(prisma.deal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            providerProfile: expect.objectContaining({
              categories: { some: { categoryId: { in: ['cat-1', 'cat-2'] } } },
            }),
          }),
        }),
      );
    });
  });

  describe('getFeaturedDeals', () => {
    it('should return up to 10 featured deals', async () => {
      prisma.deal.findMany.mockResolvedValue([
        {
          ...mockDeal,
          providerProfile: {
            id: profileId,
            bio: 'Featured business',
            city: 'Riyadh',
            country: 'SA',
            coverImageUrl: null,
            isVerified: false,
            tenant: { id: 't1', name: 'Featured Biz', slug: 'featured-biz' },
          },
        },
      ]);

      const result = await service.getFeaturedDeals();

      expect(result.success).toBe(true);
      expect(prisma.deal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
          take: 10,
        }),
      );
    });
  });

  describe('getDealById', () => {
    it('should return a deal with provider info', async () => {
      prisma.deal.findFirst.mockResolvedValue({
        ...mockDeal,
        providerProfile: {
          id: profileId,
          bio: 'Test business',
          city: 'Dubai',
          country: 'AE',
          coverImageUrl: null,
          isVerified: true,
          whatsapp: '+971501234567',
          phone: '+971501234567',
          email: 'test@example.com',
          tenant: { id: 't1', name: 'Test Biz', slug: 'test-biz' },
          categories: [],
        },
      });

      const result = await service.getDealById(dealId);

      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.id).toBe(dealId);
      expect(data.provider.name).toBe('Test Biz');
      expect(data.provider.whatsapp).toBe('+971501234567');
    });

    it('should fail when deal not found', async () => {
      prisma.deal.findFirst.mockResolvedValue(null);

      const result = await service.getDealById('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });
  });

  // === Expiry Job ===

  describe('expireDeals', () => {
    it('should deactivate expired deals and return count', async () => {
      const count = await service.expireDeals();

      expect(count).toBe(3);
      expect(prisma.deal.updateMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          expiresAt: { lt: expect.any(Date) },
        },
        data: { isActive: false },
      });
    });
  });

  // === DTO Validation ===

  describe('CreateDealSchema', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { CreateDealSchema } = require('./dto/create-deal.dto');

    it('should accept valid deal data', () => {
      const result = CreateDealSchema.safeParse({
        title: 'Summer Special',
        description: 'Great deal!',
        discountPercent: 25,
        originalPrice: 100,
        dealPrice: 75,
      });
      expect(result.success).toBe(true);
    });

    it('should require title with min 3 chars', () => {
      const result = CreateDealSchema.safeParse({ title: 'AB' });
      expect(result.success).toBe(false);
    });

    it('should reject title over 100 chars', () => {
      const result = CreateDealSchema.safeParse({ title: 'A'.repeat(101) });
      expect(result.success).toBe(false);
    });

    it('should reject discount percent < 1', () => {
      const result = CreateDealSchema.safeParse({
        title: 'Test Deal',
        discountPercent: 0,
      });
      expect(result.success).toBe(false);
    });

    it('should reject discount percent > 99', () => {
      const result = CreateDealSchema.safeParse({
        title: 'Test Deal',
        discountPercent: 100,
      });
      expect(result.success).toBe(false);
    });

    it('should reject negative prices', () => {
      const result = CreateDealSchema.safeParse({
        title: 'Test Deal',
        originalPrice: -10,
      });
      expect(result.success).toBe(false);
    });

    it('should accept valid datetime for startsAt/expiresAt', () => {
      const result = CreateDealSchema.safeParse({
        title: 'Test Deal',
        startsAt: '2026-03-01T00:00:00Z',
        expiresAt: '2026-04-01T00:00:00Z',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid datetime', () => {
      const result = CreateDealSchema.safeParse({
        title: 'Test Deal',
        startsAt: 'not-a-date',
      });
      expect(result.success).toBe(false);
    });

    it('should accept deal with only title', () => {
      const result = CreateDealSchema.safeParse({ title: 'Min Deal' });
      expect(result.success).toBe(true);
    });
  });

  describe('UpdateDealSchema', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { UpdateDealSchema } = require('./dto/update-deal.dto');

    it('should accept partial update', () => {
      const result = UpdateDealSchema.safeParse({ title: 'Updated' });
      expect(result.success).toBe(true);
    });

    it('should accept isActive field', () => {
      const result = UpdateDealSchema.safeParse({ isActive: false });
      expect(result.success).toBe(true);
    });

    it('should accept empty object (no changes)', () => {
      const result = UpdateDealSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });
});
