import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ServiceResult } from '../../common/types';
import { PaginatedResult, paginate } from '../../common/dto/pagination.dto';
import { ErrorCodes } from '../../common/constants/error-codes';
import {
  getCountryByCode,
  isValidCity,
  SUPPORTED_COUNTRY_CODES,
  CITIES,
} from '../../common/constants/locations';
import {
  UpdateProfileDto,
  CreatePackageDto,
  UpdatePackageDto,
  CreateFaqDto,
  UpdateFaqDto,
  CreatePortfolioItemDto,
  UpdatePortfolioItemDto,
  UpdateAvailabilityDto,
  ReorderDto,
  SetCategoriesDto,
} from './dto';

@Injectable()
export class ProvidersService {
  constructor(private readonly prisma: PrismaService) {}

  // === Profile ===

  private readonly profileIncludes = {
    packages: { orderBy: { sortOrder: 'asc' } as const },
    faqs: { orderBy: { sortOrder: 'asc' } as const },
    portfolioItems: { orderBy: { sortOrder: 'asc' } as const },
    categories: { include: { category: true } },
    deals: { where: { isActive: true }, orderBy: { createdAt: 'desc' } as const },
  };

  async getProfile(tenantId: string): Promise<ServiceResult<unknown>> {
    let profile = await this.prisma.providerProfile.findUnique({
      where: { tenantId },
      include: this.profileIncludes,
    });

    if (!profile) {
      profile = await this.prisma.providerProfile.create({
        data: { tenantId },
        include: this.profileIncludes,
      });
    }

    return ServiceResult.ok(profile);
  }

  async updateProfile(
    tenantId: string,
    dto: UpdateProfileDto,
  ): Promise<ServiceResult<unknown>> {
    // Validate country code if provided
    if (dto.country) {
      if (!getCountryByCode(dto.country)) {
        return ServiceResult.fail(
          ErrorCodes.VALIDATION_ERROR,
          `Unsupported country code '${dto.country}'. Supported: ${SUPPORTED_COUNTRY_CODES.join(', ')}`,
        );
      }
    }

    // Validate city against country if both provided
    if (dto.city && dto.country) {
      if (!isValidCity(dto.country, dto.city)) {
        const validCities = (CITIES[dto.country] ?? []).map((c) => c.name).join(', ');
        return ServiceResult.fail(
          ErrorCodes.VALIDATION_ERROR,
          `City '${dto.city}' is not valid for country '${dto.country}'. Valid cities: ${validCities}`,
        );
      }
    }

    const profile = await this.ensureProfile(tenantId);

    const { metadata, socialLinks, galleryUrls, businessHours, ...rest } = dto;
    const updated = await this.prisma.providerProfile.update({
      where: { id: profile.id },
      data: {
        ...rest,
        ...(metadata !== undefined && { metadata: metadata === null ? Prisma.JsonNull : metadata as Prisma.InputJsonValue }),
        ...(socialLinks !== undefined && { socialLinks: socialLinks as Prisma.InputJsonValue }),
        ...(galleryUrls !== undefined && { galleryUrls: galleryUrls as Prisma.InputJsonValue }),
        ...(businessHours !== undefined && { businessHours: businessHours as Prisma.InputJsonValue }),
      },
    });

    return ServiceResult.ok(updated);
  }

  // === Packages ===

  async listPackages(tenantId: string): Promise<ServiceResult<unknown>> {
    const profile = await this.ensureProfile(tenantId);

    const packages = await this.prisma.providerPackage.findMany({
      where: { providerProfileId: profile.id },
      orderBy: { sortOrder: 'asc' },
    });

    return ServiceResult.ok(packages);
  }

  async createPackage(
    tenantId: string,
    dto: CreatePackageDto,
  ): Promise<ServiceResult<unknown>> {
    const profile = await this.ensureProfile(tenantId);

    const pkg = await this.prisma.providerPackage.create({
      data: {
        providerProfileId: profile.id,
        name: dto.name,
        description: dto.description,
        price: dto.price,
        currency: dto.currency,
        features: dto.features,
        isActive: dto.isActive,
        sortOrder: dto.sortOrder,
      },
    });

    return ServiceResult.ok(pkg);
  }

  async updatePackage(
    tenantId: string,
    packageId: string,
    dto: UpdatePackageDto,
  ): Promise<ServiceResult<unknown>> {
    const profile = await this.ensureProfile(tenantId);

    const pkg = await this.prisma.providerPackage.findFirst({
      where: { id: packageId, providerProfileId: profile.id },
    });
    if (!pkg) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Package not found');
    }

    const updated = await this.prisma.providerPackage.update({
      where: { id: packageId },
      data: dto,
    });

    return ServiceResult.ok(updated);
  }

  async deletePackage(
    tenantId: string,
    packageId: string,
  ): Promise<ServiceResult<unknown>> {
    const profile = await this.ensureProfile(tenantId);

    const pkg = await this.prisma.providerPackage.findFirst({
      where: { id: packageId, providerProfileId: profile.id },
    });
    if (!pkg) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Package not found');
    }

    await this.prisma.providerPackage.delete({ where: { id: packageId } });

    return ServiceResult.ok({ deleted: true });
  }

  async reorderPackages(
    tenantId: string,
    dto: ReorderDto,
  ): Promise<ServiceResult<unknown>> {
    const profile = await this.ensureProfile(tenantId);

    await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.providerPackage.updateMany({
          where: { id: item.id, providerProfileId: profile.id },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );

    return ServiceResult.ok({ reordered: true });
  }

  // === FAQs ===

  async listFaqs(tenantId: string): Promise<ServiceResult<unknown>> {
    const profile = await this.ensureProfile(tenantId);

    const faqs = await this.prisma.providerFaq.findMany({
      where: { providerProfileId: profile.id },
      orderBy: { sortOrder: 'asc' },
    });

    return ServiceResult.ok(faqs);
  }

  async createFaq(
    tenantId: string,
    dto: CreateFaqDto,
  ): Promise<ServiceResult<unknown>> {
    const profile = await this.ensureProfile(tenantId);

    const faq = await this.prisma.providerFaq.create({
      data: {
        providerProfileId: profile.id,
        question: dto.question,
        answer: dto.answer,
        sortOrder: dto.sortOrder,
      },
    });

    return ServiceResult.ok(faq);
  }

  async updateFaq(
    tenantId: string,
    faqId: string,
    dto: UpdateFaqDto,
  ): Promise<ServiceResult<unknown>> {
    const profile = await this.ensureProfile(tenantId);

    const faq = await this.prisma.providerFaq.findFirst({
      where: { id: faqId, providerProfileId: profile.id },
    });
    if (!faq) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'FAQ not found');
    }

    const updated = await this.prisma.providerFaq.update({
      where: { id: faqId },
      data: dto,
    });

    return ServiceResult.ok(updated);
  }

  async deleteFaq(
    tenantId: string,
    faqId: string,
  ): Promise<ServiceResult<unknown>> {
    const profile = await this.ensureProfile(tenantId);

    const faq = await this.prisma.providerFaq.findFirst({
      where: { id: faqId, providerProfileId: profile.id },
    });
    if (!faq) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'FAQ not found');
    }

    await this.prisma.providerFaq.delete({ where: { id: faqId } });

    return ServiceResult.ok({ deleted: true });
  }

  async reorderFaqs(
    tenantId: string,
    dto: ReorderDto,
  ): Promise<ServiceResult<unknown>> {
    const profile = await this.ensureProfile(tenantId);

    await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.providerFaq.updateMany({
          where: { id: item.id, providerProfileId: profile.id },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );

    return ServiceResult.ok({ reordered: true });
  }

  // === Portfolio Items ===

  async listPortfolioItems(tenantId: string): Promise<ServiceResult<unknown>> {
    const profile = await this.ensureProfile(tenantId);

    const items = await this.prisma.portfolioItem.findMany({
      where: { providerProfileId: profile.id },
      orderBy: { sortOrder: 'asc' },
    });

    return ServiceResult.ok(items);
  }

  async createPortfolioItem(
    tenantId: string,
    dto: CreatePortfolioItemDto,
  ): Promise<ServiceResult<unknown>> {
    const profile = await this.ensureProfile(tenantId);

    const item = await this.prisma.portfolioItem.create({
      data: {
        providerProfileId: profile.id,
        title: dto.title,
        description: dto.description,
        imageUrl: dto.imageUrl,
        videoUrl: dto.videoUrl,
        tags: dto.tags,
        sortOrder: dto.sortOrder,
      },
    });

    return ServiceResult.ok(item);
  }

  async updatePortfolioItem(
    tenantId: string,
    itemId: string,
    dto: UpdatePortfolioItemDto,
  ): Promise<ServiceResult<unknown>> {
    const profile = await this.ensureProfile(tenantId);

    const item = await this.prisma.portfolioItem.findFirst({
      where: { id: itemId, providerProfileId: profile.id },
    });
    if (!item) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Portfolio item not found');
    }

    const updated = await this.prisma.portfolioItem.update({
      where: { id: itemId },
      data: dto,
    });

    return ServiceResult.ok(updated);
  }

  async deletePortfolioItem(
    tenantId: string,
    itemId: string,
  ): Promise<ServiceResult<unknown>> {
    const profile = await this.ensureProfile(tenantId);

    const item = await this.prisma.portfolioItem.findFirst({
      where: { id: itemId, providerProfileId: profile.id },
    });
    if (!item) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Portfolio item not found');
    }

    await this.prisma.portfolioItem.delete({ where: { id: itemId } });

    return ServiceResult.ok({ deleted: true });
  }

  async reorderPortfolioItems(
    tenantId: string,
    dto: ReorderDto,
  ): Promise<ServiceResult<unknown>> {
    const profile = await this.ensureProfile(tenantId);

    await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.portfolioItem.updateMany({
          where: { id: item.id, providerProfileId: profile.id },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );

    return ServiceResult.ok({ reordered: true });
  }

  // === Availability ===

  async getAvailability(
    tenantId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<ServiceResult<unknown>> {
    const profile = await this.ensureProfile(tenantId);

    const where: Prisma.ProviderAvailabilityWhereInput = {
      providerProfileId: profile.id,
    };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    const entries = await this.prisma.providerAvailability.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    return ServiceResult.ok(entries);
  }

  async updateAvailability(
    tenantId: string,
    dto: UpdateAvailabilityDto,
  ): Promise<ServiceResult<unknown>> {
    const profile = await this.ensureProfile(tenantId);

    const results = await this.prisma.$transaction(
      dto.entries.map((entry) =>
        this.prisma.providerAvailability.upsert({
          where: {
            providerProfileId_date: {
              providerProfileId: profile.id,
              date: new Date(entry.date),
            },
          },
          update: {
            isAvailable: entry.isAvailable,
            note: entry.note,
          },
          create: {
            providerProfileId: profile.id,
            date: new Date(entry.date),
            isAvailable: entry.isAvailable,
            note: entry.note,
          },
        }),
      ),
    );

    return ServiceResult.ok(results);
  }

  // === Dashboard Stats ===

  async getDashboardStats(tenantId: string): Promise<ServiceResult<unknown>> {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { tenantId },
    });

    if (!profile) {
      return ServiceResult.ok({
        totalBookings: 0,
        pendingBookings: 0,
        totalReviews: 0,
        averageRating: 0,
        totalPackages: 0,
        portfolioItems: 0,
        profileCompleteness: 0,
        contactClicks: { total: 0, byType: {} },
      });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      packageCount,
      portfolioCount,
      bookingCount,
      pendingBookingCount,
      contactClicks,
    ] = await Promise.all([
      this.prisma.providerPackage.count({
        where: { providerProfileId: profile.id },
      }),
      this.prisma.portfolioItem.count({
        where: { providerProfileId: profile.id },
      }),
      this.prisma.booking
        .count({ where: { tenantId } })
        .catch(() => 0),
      this.prisma.booking
        .count({ where: { tenantId, status: 'PENDING' } })
        .catch(() => 0),
      this.prisma.contactClick
        .groupBy({
          by: ['type'],
          where: {
            providerProfileId: profile.id,
            createdAt: { gte: thirtyDaysAgo },
          },
          _count: { id: true },
        })
        .catch(() => [] as { type: string; _count: { id: number } }[]),
    ]);

    // Calculate profile completeness
    const fields = [
      profile.bio,
      profile.description,
      profile.phone,
      profile.email,
      profile.city,
      profile.coverImageUrl,
    ];
    const filledFields = fields.filter(Boolean).length;
    const profileCompleteness = Math.round((filledFields / fields.length) * 100);

    const clicksByType: Record<string, number> = {};
    for (const click of contactClicks) {
      clicksByType[click.type] = click._count.id;
    }
    const totalClicks = Object.values(clicksByType).reduce(
      (sum, c) => sum + c,
      0,
    );

    return ServiceResult.ok({
      totalBookings: bookingCount,
      pendingBookings: pendingBookingCount,
      totalReviews: profile.reviewCount,
      averageRating: Number(profile.rating),
      totalPackages: packageCount,
      portfolioItems: portfolioCount,
      profileCompleteness,
      contactClicks: {
        total: totalClicks,
        byType: clicksByType,
      },
    });
  }

  // === Public Search ===

  async searchProviders(filters: {
    q?: string;
    category?: string;
    categoryId?: string;
    city?: string;
    country?: string;
    verified?: boolean;
    hasDeals?: boolean;
    minRating?: number;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ServiceResult<unknown>> {
    const page = filters.page ?? 1;
    const pageSize = Math.min(filters.pageSize ?? 20, 100);

    const where: Prisma.ProviderProfileWhereInput = {};

    if (filters.q) {
      where.OR = [
        { bio: { contains: filters.q, mode: 'insensitive' } },
        { description: { contains: filters.q, mode: 'insensitive' } },
        { city: { contains: filters.q, mode: 'insensitive' } },
        { tenant: { name: { contains: filters.q, mode: 'insensitive' } } },
      ];
    }

    if (filters.category) {
      const slugs = filters.category.split(',').map((s) => s.trim()).filter(Boolean);
      // Resolve parent categories to include their children
      const allCategoryIds = await this.resolveCategorySlugs(slugs);
      if (allCategoryIds.length > 0) {
        where.categories = {
          some: { categoryId: { in: allCategoryIds } },
        };
      }
    } else if (filters.categoryId) {
      const ids = filters.categoryId.split(',').map((s) => s.trim()).filter(Boolean);
      where.categories = {
        some: { categoryId: { in: ids } },
      };
    }

    if (filters.city) {
      where.city = { equals: filters.city, mode: 'insensitive' };
    }

    if (filters.country) {
      where.country = { equals: filters.country, mode: 'insensitive' };
    }

    if (filters.minRating) {
      where.rating = { gte: filters.minRating };
    }

    if (filters.verified !== undefined) {
      where.isVerified = filters.verified;
    }

    if (filters.hasDeals) {
      where.deals = {
        some: {
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
      };
    }

    // Determine ordering — verified businesses rank higher by default
    let orderBy: Prisma.ProviderProfileOrderByWithRelationInput[] = [
      { isVerified: 'desc' },
      { rating: 'desc' },
    ];
    if (filters.sort) {
      const desc = filters.sort.startsWith('-');
      const field = desc ? filters.sort.slice(1) : filters.sort;
      if (['rating', 'reviewCount', 'createdAt'].includes(field)) {
        orderBy = [
          { isVerified: 'desc' },
          { [field]: desc ? 'desc' : 'asc' },
        ];
      }
    }

    const [items, totalCount] = await Promise.all([
      this.prisma.providerProfile.findMany({
        where,
        include: {
          tenant: { select: { id: true, name: true, slug: true } },
          packages: {
            where: { isActive: true },
            orderBy: { price: 'asc' },
            take: 1,
          },
          categories: { include: { category: true } },
          _count: {
            select: {
              deals: {
                where: {
                  isActive: true,
                  OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } },
                  ],
                },
              },
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy,
      }),
      this.prisma.providerProfile.count({ where }),
    ]);

    // Filter by price range if specified (post-query since it depends on packages)
    let filtered = items;
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      filtered = items.filter((item: { packages: { price: unknown }[] }) => {
        if (item.packages.length === 0) return false;
        const lowestPrice = Number(item.packages[0].price);
        if (filters.minPrice !== undefined && lowestPrice < filters.minPrice) return false;
        if (filters.maxPrice !== undefined && lowestPrice > filters.maxPrice) return false;
        return true;
      });
    }

    const mapped = filtered.map((p: any) => ({
      id: p.id,
      name: p.displayName || p.tenant?.name || 'Unnamed',
      slug: p.slug || p.tenant?.slug || p.id,
      categories: (p.categories || []).map((pc: any) => ({
        id: pc.category.id,
        name: pc.category.name,
        slug: pc.category.slug,
        isPrimary: pc.isPrimary,
      })),
      country: p.country || '',
      city: p.city || '',
      location: [p.city, p.state, p.country].filter(Boolean).join(', '),
      coverPhoto: p.coverImageUrl,
      rating: Number(p.rating) || 0,
      reviewCount: p.reviewCount || 0,
      startingPrice: p.packages?.[0] ? Number(p.packages[0].price) : 0,
      featured: p.isFeatured || false,
      verified: p.isVerified || false,
      description: p.bio || '',
      whatsapp: p.whatsapp || '',
      activeDeals: p._count?.deals ?? 0,
    }));

    return ServiceResult.ok(paginate(mapped, totalCount, { page, pageSize }));
  }

  async getPublicProfile(profileId: string): Promise<ServiceResult<unknown>> {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { id: profileId },
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
        packages: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        faqs: { orderBy: { sortOrder: 'asc' } },
        portfolioItems: { orderBy: { sortOrder: 'asc' } },
        categories: { include: { category: true } },
        deals: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!profile) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Provider not found');
    }

    const p = profile as any;
    return ServiceResult.ok({
      id: p.id,
      name: p.displayName || p.tenant?.name || 'Unnamed',
      slug: p.slug || p.tenant?.slug || p.id,
      categories: (p.categories || [])
        .sort((a: any, b: any) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0))
        .map((pc: any) => ({
          id: pc.category.id,
          name: pc.category.name,
          slug: pc.category.slug,
          icon: pc.category.icon || '',
          color: pc.category.color || '',
          isPrimary: pc.isPrimary,
        })),
      country: p.country || '',
      city: p.city || '',
      location: [p.city, p.state, p.country].filter(Boolean).join(', '),
      coverPhoto: p.coverImageUrl,
      avatar: null,
      description: p.bio || '',
      rating: Number(p.rating) || 0,
      reviewCount: p.reviewCount || 0,
      startingPrice: p.packages?.[0] ? Number(p.packages[0].price) : 0,
      responseTime: '24h',
      verified: p.isVerified || false,
      contactEmail: p.email || '',
      contactPhone: p.phone || '',
      whatsapp: p.whatsapp || '',
      whatsappUrl: p.whatsapp
        ? this.generateWhatsAppUrl(p.whatsapp, p.whatsappMessage)
        : null,
      instagram: p.instagram || '',
      tiktok: p.tiktok || '',
      website: p.website,
      businessHours: p.businessHours || {},
      portfolio: (p.portfolioItems || []).map((item: any) => ({
        id: item.id,
        url: item.imageUrl,
        title: item.title || '',
        description: item.description || '',
      })),
      packages: (p.packages || []).map((pkg: any) => ({
        id: pkg.id,
        name: pkg.name,
        price: Number(pkg.price),
        description: pkg.description || '',
        inclusions: Array.isArray(pkg.features) ? pkg.features : [],
        popular: pkg.sortOrder === 0,
      })),
      deals: (p.deals || []).map((deal: any) => ({
        id: deal.id,
        title: deal.title,
        description: deal.description || '',
        discountPercent: deal.discountPercent,
        originalPrice: deal.originalPrice ? Number(deal.originalPrice) : null,
        dealPrice: deal.dealPrice ? Number(deal.dealPrice) : null,
        imageUrl: deal.imageUrl,
        startsAt: deal.startsAt,
        expiresAt: deal.expiresAt,
      })),
      reviews: [],
      faqs: (p.faqs || []).map((faq: any) => ({
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
      })),
    });
  }

  // === Categories ===

  async getCategories(tenantId: string): Promise<ServiceResult<unknown>> {
    const profile = await this.ensureProfile(tenantId);

    const providerCategories = await this.prisma.providerCategory.findMany({
      where: { providerProfileId: profile.id },
      include: { category: true },
      orderBy: { isPrimary: 'desc' },
    });

    return ServiceResult.ok(
      providerCategories.map((pc: any) => ({
        id: pc.category.id,
        name: pc.category.name,
        slug: pc.category.slug,
        icon: pc.category.icon || '',
        color: pc.category.color || '',
        isPrimary: pc.isPrimary,
      })),
    );
  }

  async setCategories(
    tenantId: string,
    dto: SetCategoriesDto,
  ): Promise<ServiceResult<unknown>> {
    const profile = await this.ensureProfile(tenantId);

    // Validate all category IDs exist
    const categories = await this.prisma.category.findMany({
      where: { id: { in: dto.categoryIds }, isActive: true },
    });

    if (categories.length !== dto.categoryIds.length) {
      const foundIds = new Set(categories.map((c) => c.id));
      const missing = dto.categoryIds.filter((id) => !foundIds.has(id));
      return ServiceResult.fail(
        ErrorCodes.VALIDATION_ERROR,
        `Categories not found: ${missing.join(', ')}`,
      );
    }

    // Replace all categories in a transaction
    await this.prisma.$transaction([
      this.prisma.providerCategory.deleteMany({
        where: { providerProfileId: profile.id },
      }),
      ...dto.categoryIds.map((categoryId) =>
        this.prisma.providerCategory.create({
          data: {
            providerProfileId: profile.id,
            categoryId,
            isPrimary: categoryId === dto.primaryCategoryId,
          },
        }),
      ),
    ]);

    return this.getCategories(tenantId);
  }

  async listCategories(options?: {
    withCount?: boolean;
  }): Promise<ServiceResult<unknown>> {
    const withCount = options?.withCount ?? true;

    const categories = await this.prisma.category.findMany({
      where: { isActive: true, parentId: null },
      orderBy: { sortOrder: 'asc' },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          ...(withCount && {
            include: { _count: { select: { providers: true } } },
          }),
        },
        ...(withCount && {
          _count: { select: { providers: true } },
        }),
      },
    });

    const mapped = categories.map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      icon: c.icon || '',
      color: c.color || '',
      vendorCount: withCount ? (c._count?.providers ?? 0) : undefined,
      description: c.description || '',
      children: (c.children || []).map((child: any) => ({
        id: child.id,
        name: child.name,
        slug: child.slug,
        icon: child.icon || '',
        vendorCount: withCount ? (child._count?.providers ?? 0) : undefined,
      })),
    }));

    return ServiceResult.ok(mapped);
  }

  async getCategoryBySlug(slug: string): Promise<ServiceResult<unknown>> {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        children: { where: { isActive: true }, select: { id: true } },
      },
    });

    if (!category) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, `Category '${slug}' not found`);
    }

    return ServiceResult.ok(category);
  }

  // === Helpers ===

  /**
   * Resolves category slugs to IDs, including children of parent categories.
   */
  private async resolveCategorySlugs(slugs: string[]): Promise<string[]> {
    const categories = await this.prisma.category.findMany({
      where: { slug: { in: slugs }, isActive: true },
      include: {
        children: { where: { isActive: true }, select: { id: true } },
      },
    });

    const ids: string[] = [];
    for (const cat of categories) {
      ids.push(cat.id);
      // If it's a parent category, include all children
      if (cat.children.length > 0) {
        ids.push(...cat.children.map((c) => c.id));
      }
    }
    return [...new Set(ids)];
  }

  private generateWhatsAppUrl(
    whatsappNumber: string,
    customMessage?: string | null,
  ): string {
    const defaultMessage =
      "Hi! I found your business on Habesha Hub. I'd like to inquire about your services.";
    let cleaned = whatsappNumber.replace(/[^+\d]/g, '');
    if (cleaned.startsWith('00')) cleaned = '+' + cleaned.slice(2);
    if (!cleaned.startsWith('+')) cleaned = '+' + cleaned;
    const numberWithoutPlus = cleaned.replace('+', '');
    const message = customMessage || defaultMessage;
    return `https://wa.me/${numberWithoutPlus}?text=${encodeURIComponent(message)}`;
  }

  private async ensureProfile(tenantId: string) {
    let profile = await this.prisma.providerProfile.findUnique({
      where: { tenantId },
    });

    if (!profile) {
      profile = await this.prisma.providerProfile.create({
        data: { tenantId },
      });
    }

    return profile;
  }
}
