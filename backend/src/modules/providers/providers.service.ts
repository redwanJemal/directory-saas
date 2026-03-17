import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ServiceResult } from '../../common/types';
import { PaginatedResult, paginate } from '../../common/dto/pagination.dto';
import { ErrorCodes } from '../../common/constants/error-codes';
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
      });
    }

    const [packageCount, portfolioCount, bookingCount, pendingBookingCount] =
      await Promise.all([
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

    return ServiceResult.ok({
      totalBookings: bookingCount,
      pendingBookings: pendingBookingCount,
      totalReviews: profile.reviewCount,
      averageRating: Number(profile.rating),
      totalPackages: packageCount,
      portfolioItems: portfolioCount,
      profileCompleteness,
    });
  }

  // === Public Search ===

  async searchProviders(filters: {
    q?: string;
    category?: string;
    city?: string;
    country?: string;
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
      where.categories = {
        some: {
          category: { slug: filters.category },
        },
      };
    }

    if (filters.city) {
      where.city = { contains: filters.city, mode: 'insensitive' };
    }

    if (filters.country) {
      where.country = { contains: filters.country, mode: 'insensitive' };
    }

    if (filters.minRating) {
      where.rating = { gte: filters.minRating };
    }

    // Determine ordering
    let orderBy: Prisma.ProviderProfileOrderByWithRelationInput = { rating: 'desc' };
    if (filters.sort) {
      const desc = filters.sort.startsWith('-');
      const field = desc ? filters.sort.slice(1) : filters.sort;
      if (['rating', 'reviewCount', 'createdAt'].includes(field)) {
        orderBy = { [field]: desc ? 'desc' : 'asc' };
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

  async listCategories(): Promise<ServiceResult<unknown>> {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true, parentId: null },
      orderBy: { sortOrder: 'asc' },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            _count: { select: { providers: true } },
          },
        },
        _count: { select: { providers: true } },
      },
    });

    const mapped = categories.map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      icon: c.icon || '',
      color: c.color || '',
      vendorCount: c._count.providers,
      description: c.description || '',
      children: (c.children || []).map((child: any) => ({
        id: child.id,
        name: child.name,
        slug: child.slug,
        icon: child.icon || '',
        vendorCount: child._count.providers,
      })),
    }));

    return ServiceResult.ok(mapped);
  }

  // === Helpers ===

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
