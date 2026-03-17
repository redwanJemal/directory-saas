import { ProvidersService } from './providers.service';

describe('ProvidersService', () => {
  let service: ProvidersService;
  let prisma: any;

  const tenantId = 'tenant-uuid-1';
  const profileId = 'profile-uuid-1';

  const mockProfile = {
    id: profileId,
    tenantId,
    bio: 'Test bio',
    description: 'Test desc',
  };

  const mockCategories = [
    {
      id: 'cat-1',
      name: 'Food & Drink',
      slug: 'food-drink',
      icon: 'utensils',
      color: '#ff0000',
      isActive: true,
      parentId: null,
    },
    {
      id: 'cat-2',
      name: 'Restaurant',
      slug: 'restaurant',
      icon: '',
      color: '',
      isActive: true,
      parentId: 'cat-1',
    },
    {
      id: 'cat-3',
      name: 'Catering',
      slug: 'catering',
      icon: '',
      color: '',
      isActive: true,
      parentId: 'cat-1',
    },
    {
      id: 'cat-4',
      name: 'Beauty & Grooming',
      slug: 'beauty-grooming',
      icon: 'scissors',
      color: '#ff00ff',
      isActive: true,
      parentId: null,
    },
    {
      id: 'cat-5',
      name: 'Salon',
      slug: 'salon',
      icon: '',
      color: '',
      isActive: true,
      parentId: 'cat-4',
    },
  ];

  beforeEach(() => {
    prisma = {
      providerProfile: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      providerCategory: {
        findMany: jest.fn(),
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
      category: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      providerPackage: {
        findMany: jest.fn(),
        create: jest.fn(),
        count: jest.fn(),
      },
      portfolioItem: {
        count: jest.fn(),
      },
      booking: {
        count: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation((ops) => {
        if (Array.isArray(ops)) return Promise.all(ops);
        return ops(prisma);
      }),
    };

    service = new ProvidersService(prisma);
  });

  // === Category Assignment ===

  describe('getCategories', () => {
    it('should return categories for a provider', async () => {
      prisma.providerProfile.findUnique.mockResolvedValue(mockProfile);
      prisma.providerCategory.findMany.mockResolvedValue([
        {
          isPrimary: true,
          category: {
            id: 'cat-1',
            name: 'Food & Drink',
            slug: 'food-drink',
            icon: 'utensils',
            color: '#ff0000',
          },
        },
        {
          isPrimary: false,
          category: {
            id: 'cat-2',
            name: 'Restaurant',
            slug: 'restaurant',
            icon: '',
            color: '',
          },
        },
      ]);

      const result = await service.getCategories(tenantId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect((result.data as any[])[0].isPrimary).toBe(true);
      expect((result.data as any[])[0].name).toBe('Food & Drink');
    });

    it('should auto-create profile if none exists', async () => {
      prisma.providerProfile.findUnique.mockResolvedValue(null);
      prisma.providerProfile.create.mockResolvedValue(mockProfile);
      prisma.providerCategory.findMany.mockResolvedValue([]);

      const result = await service.getCategories(tenantId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(prisma.providerProfile.create).toHaveBeenCalled();
    });
  });

  describe('setCategories', () => {
    it('should set categories successfully', async () => {
      prisma.providerProfile.findUnique.mockResolvedValue(mockProfile);
      prisma.category.findMany.mockResolvedValueOnce([
        mockCategories[0],
        mockCategories[1],
      ]);
      prisma.providerCategory.deleteMany.mockResolvedValue({ count: 0 });
      prisma.providerCategory.create.mockResolvedValue({});

      // Mock the getCategories call at the end
      prisma.providerCategory.findMany.mockResolvedValue([
        {
          isPrimary: true,
          category: {
            id: 'cat-1',
            name: 'Food & Drink',
            slug: 'food-drink',
            icon: 'utensils',
            color: '#ff0000',
          },
        },
        {
          isPrimary: false,
          category: {
            id: 'cat-2',
            name: 'Restaurant',
            slug: 'restaurant',
            icon: '',
            color: '',
          },
        },
      ]);

      const result = await service.setCategories(tenantId, {
        categoryIds: ['cat-1', 'cat-2'],
        primaryCategoryId: 'cat-1',
      });

      expect(result.success).toBe(true);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should fail if a category does not exist', async () => {
      prisma.providerProfile.findUnique.mockResolvedValue(mockProfile);
      prisma.category.findMany.mockResolvedValueOnce([mockCategories[0]]);

      const result = await service.setCategories(tenantId, {
        categoryIds: ['cat-1', 'nonexistent-id'],
        primaryCategoryId: 'cat-1',
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.message).toContain('nonexistent-id');
    });

    it('should validate min 1 category at DTO level', () => {
      const { SetCategoriesSchema } = require('./dto/set-categories.dto');
      const result = SetCategoriesSchema.safeParse({
        categoryIds: [],
        primaryCategoryId: 'cat-1',
      });
      expect(result.success).toBe(false);
    });

    it('should validate max 5 categories at DTO level', () => {
      const { SetCategoriesSchema } = require('./dto/set-categories.dto');
      const ids = Array.from({ length: 6 }, (_, i) =>
        `00000000-0000-0000-0000-00000000000${i}`,
      );
      const result = SetCategoriesSchema.safeParse({
        categoryIds: ids,
        primaryCategoryId: ids[0],
      });
      expect(result.success).toBe(false);
    });

    it('should validate primaryCategoryId must be in categoryIds', () => {
      const { SetCategoriesSchema } = require('./dto/set-categories.dto');
      const result = SetCategoriesSchema.safeParse({
        categoryIds: ['00000000-0000-0000-0000-000000000001'],
        primaryCategoryId: '00000000-0000-0000-0000-000000000002',
      });
      expect(result.success).toBe(false);
    });

    it('should accept valid DTO with primary in list', () => {
      const { SetCategoriesSchema } = require('./dto/set-categories.dto');
      const id = '00000000-0000-0000-0000-000000000001';
      const result = SetCategoriesSchema.safeParse({
        categoryIds: [id],
        primaryCategoryId: id,
      });
      expect(result.success).toBe(true);
    });
  });

  // === Search by Category ===

  describe('searchProviders', () => {
    const buildSearchMocks = () => {
      prisma.providerProfile.findMany.mockResolvedValue([]);
      prisma.providerProfile.count.mockResolvedValue(0);
    };

    it('should filter by single category slug', async () => {
      prisma.category.findMany.mockResolvedValueOnce([
        { id: 'cat-2', slug: 'restaurant', children: [] },
      ]);
      buildSearchMocks();

      await service.searchProviders({ category: 'restaurant' });

      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { slug: { in: ['restaurant'] }, isActive: true },
        }),
      );
    });

    it('should filter by comma-separated category slugs', async () => {
      prisma.category.findMany.mockResolvedValueOnce([
        { id: 'cat-2', slug: 'restaurant', children: [] },
        { id: 'cat-3', slug: 'catering', children: [] },
      ]);
      buildSearchMocks();

      await service.searchProviders({ category: 'restaurant,catering' });

      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { slug: { in: ['restaurant', 'catering'] }, isActive: true },
        }),
      );
    });

    it('should include child categories when filtering by parent', async () => {
      prisma.category.findMany.mockResolvedValueOnce([
        {
          id: 'cat-1',
          slug: 'food-drink',
          children: [{ id: 'cat-2' }, { id: 'cat-3' }],
        },
      ]);
      buildSearchMocks();

      await service.searchProviders({ category: 'food-drink' });

      // The where clause should include parent + children IDs
      const findManyCall = prisma.providerProfile.findMany.mock.calls[0][0];
      expect(findManyCall.where.categories.some.categoryId.in).toEqual(
        expect.arrayContaining(['cat-1', 'cat-2', 'cat-3']),
      );
    });

    it('should filter by categoryId', async () => {
      buildSearchMocks();

      await service.searchProviders({ categoryId: 'cat-1' });

      const findManyCall = prisma.providerProfile.findMany.mock.calls[0][0];
      expect(findManyCall.where.categories.some.categoryId.in).toEqual(['cat-1']);
    });

    it('should filter by comma-separated categoryIds', async () => {
      buildSearchMocks();

      await service.searchProviders({ categoryId: 'cat-1,cat-2' });

      const findManyCall = prisma.providerProfile.findMany.mock.calls[0][0];
      expect(findManyCall.where.categories.some.categoryId.in).toEqual([
        'cat-1',
        'cat-2',
      ]);
    });
  });

  // === Search by Location ===

  describe('searchProviders — location filters', () => {
    const buildSearchMocks = () => {
      prisma.providerProfile.findMany.mockResolvedValue([]);
      prisma.providerProfile.count.mockResolvedValue(0);
    };

    it('should filter by country code', async () => {
      buildSearchMocks();

      await service.searchProviders({ country: 'AE' });

      const findManyCall = prisma.providerProfile.findMany.mock.calls[0][0];
      expect(findManyCall.where.country).toEqual({
        equals: 'AE',
        mode: 'insensitive',
      });
    });

    it('should filter by city name', async () => {
      buildSearchMocks();

      await service.searchProviders({ city: 'Dubai' });

      const findManyCall = prisma.providerProfile.findMany.mock.calls[0][0];
      expect(findManyCall.where.city).toEqual({
        equals: 'Dubai',
        mode: 'insensitive',
      });
    });

    it('should filter by both country and city', async () => {
      buildSearchMocks();

      await service.searchProviders({ country: 'AE', city: 'Dubai' });

      const findManyCall = prisma.providerProfile.findMany.mock.calls[0][0];
      expect(findManyCall.where.country).toEqual({
        equals: 'AE',
        mode: 'insensitive',
      });
      expect(findManyCall.where.city).toEqual({
        equals: 'Dubai',
        mode: 'insensitive',
      });
    });

    it('should combine location with category filters', async () => {
      prisma.category.findMany.mockResolvedValueOnce([
        { id: 'cat-2', slug: 'restaurant', children: [] },
      ]);
      buildSearchMocks();

      await service.searchProviders({
        country: 'AE',
        city: 'Dubai',
        category: 'restaurant',
      });

      const findManyCall = prisma.providerProfile.findMany.mock.calls[0][0];
      expect(findManyCall.where.country).toBeDefined();
      expect(findManyCall.where.city).toBeDefined();
      expect(findManyCall.where.categories).toBeDefined();
    });
  });

  // === Profile Location Validation ===

  describe('updateProfile — location validation', () => {
    it('should reject invalid country code', async () => {
      const result = await service.updateProfile(tenantId, {
        country: 'XX',
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.message).toContain('XX');
    });

    it('should reject invalid city for valid country', async () => {
      const result = await service.updateProfile(tenantId, {
        country: 'AE',
        city: 'Riyadh',
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.message).toContain('Riyadh');
    });

    it('should accept valid country and city', async () => {
      prisma.providerProfile.findUnique.mockResolvedValue(mockProfile);
      prisma.providerProfile.update.mockResolvedValue({
        ...mockProfile,
        country: 'AE',
        city: 'Dubai',
      });

      const result = await service.updateProfile(tenantId, {
        country: 'AE',
        city: 'Dubai',
      });

      expect(result.success).toBe(true);
    });

    it('should accept valid country without city', async () => {
      prisma.providerProfile.findUnique.mockResolvedValue(mockProfile);
      prisma.providerProfile.update.mockResolvedValue({
        ...mockProfile,
        country: 'SA',
      });

      const result = await service.updateProfile(tenantId, {
        country: 'SA',
      });

      expect(result.success).toBe(true);
    });

    it('should allow city update without country (no cross-validation)', async () => {
      prisma.providerProfile.findUnique.mockResolvedValue(mockProfile);
      prisma.providerProfile.update.mockResolvedValue({
        ...mockProfile,
        city: 'Dubai',
      });

      const result = await service.updateProfile(tenantId, {
        city: 'Dubai',
      });

      expect(result.success).toBe(true);
    });
  });

  // === Category Tree with Counts ===

  describe('listCategories', () => {
    it('should return category tree with provider counts by default', async () => {
      prisma.category.findMany.mockResolvedValue([
        {
          id: 'cat-1',
          name: 'Food & Drink',
          slug: 'food-drink',
          icon: 'utensils',
          color: '#ff0000',
          description: 'Food businesses',
          _count: { providers: 5 },
          children: [
            {
              id: 'cat-2',
              name: 'Restaurant',
              slug: 'restaurant',
              icon: '',
              _count: { providers: 3 },
            },
          ],
        },
      ]);

      const result = await service.listCategories();

      expect(result.success).toBe(true);
      const data = result.data as any[];
      expect(data[0].vendorCount).toBe(5);
      expect(data[0].children[0].vendorCount).toBe(3);
    });

    it('should omit counts when withCount is false', async () => {
      prisma.category.findMany.mockResolvedValue([
        {
          id: 'cat-1',
          name: 'Food & Drink',
          slug: 'food-drink',
          icon: 'utensils',
          color: '#ff0000',
          description: 'Food businesses',
          children: [
            {
              id: 'cat-2',
              name: 'Restaurant',
              slug: 'restaurant',
              icon: '',
            },
          ],
        },
      ]);

      const result = await service.listCategories({ withCount: false });

      expect(result.success).toBe(true);
      const data = result.data as any[];
      expect(data[0].vendorCount).toBeUndefined();
    });

    it('should return hierarchical structure with parent and children', async () => {
      prisma.category.findMany.mockResolvedValue([
        {
          id: 'cat-1',
          name: 'Food & Drink',
          slug: 'food-drink',
          icon: 'utensils',
          color: '#ff0000',
          description: 'Food businesses',
          _count: { providers: 5 },
          children: [
            {
              id: 'cat-2',
              name: 'Restaurant',
              slug: 'restaurant',
              icon: 'store',
              _count: { providers: 3 },
            },
            {
              id: 'cat-3',
              name: 'Catering',
              slug: 'catering',
              icon: 'truck',
              _count: { providers: 2 },
            },
          ],
        },
        {
          id: 'cat-4',
          name: 'Beauty & Grooming',
          slug: 'beauty-grooming',
          icon: 'scissors',
          color: '#ff00ff',
          description: 'Beauty services',
          _count: { providers: 1 },
          children: [],
        },
      ]);

      const result = await service.listCategories();

      expect(result.success).toBe(true);
      const data = result.data as any[];
      expect(data).toHaveLength(2);
      expect(data[0].children).toHaveLength(2);
      expect(data[1].children).toHaveLength(0);
    });
  });
});
