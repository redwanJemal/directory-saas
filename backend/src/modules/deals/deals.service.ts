import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ServiceResult } from '../../common/types';
import { PaginatedResult, paginate } from '../../common/dto/pagination.dto';
import { ErrorCodes } from '../../common/constants/error-codes';
import { CreateDealDto, UpdateDealDto } from './dto';

@Injectable()
export class DealsService {
  private readonly logger = new Logger(DealsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // === Provider CRUD ===

  async listProviderDeals(
    tenantId: string,
    page: number,
    pageSize: number,
  ): Promise<ServiceResult<PaginatedResult<unknown>>> {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { tenantId },
    });

    if (!profile) {
      return ServiceResult.ok(paginate([], 0, { page, pageSize }));
    }

    const where = { providerProfileId: profile.id };

    const [items, totalCount] = await Promise.all([
      this.prisma.deal.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.deal.count({ where }),
    ]);

    return ServiceResult.ok(paginate(items, totalCount, { page, pageSize }));
  }

  async createDeal(
    tenantId: string,
    dto: CreateDealDto,
  ): Promise<ServiceResult<unknown>> {
    let profile = await this.prisma.providerProfile.findUnique({
      where: { tenantId },
    });

    if (!profile) {
      profile = await this.prisma.providerProfile.create({
        data: { tenantId },
      });
    }

    const deal = await this.prisma.deal.create({
      data: {
        providerProfileId: profile.id,
        title: dto.title,
        description: dto.description,
        discountPercent: dto.discountPercent,
        originalPrice: dto.originalPrice,
        dealPrice: dto.dealPrice,
        imageUrl: dto.imageUrl,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
    });

    return ServiceResult.ok(deal);
  }

  async updateDeal(
    tenantId: string,
    dealId: string,
    dto: UpdateDealDto,
  ): Promise<ServiceResult<unknown>> {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { tenantId },
    });

    if (!profile) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Provider profile not found');
    }

    const deal = await this.prisma.deal.findFirst({
      where: { id: dealId, providerProfileId: profile.id },
    });

    if (!deal) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Deal not found');
    }

    const updated = await this.prisma.deal.update({
      where: { id: dealId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.discountPercent !== undefined && { discountPercent: dto.discountPercent }),
        ...(dto.originalPrice !== undefined && { originalPrice: dto.originalPrice }),
        ...(dto.dealPrice !== undefined && { dealPrice: dto.dealPrice }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.startsAt !== undefined && { startsAt: new Date(dto.startsAt) }),
        ...(dto.expiresAt !== undefined && { expiresAt: new Date(dto.expiresAt) }),
      },
    });

    return ServiceResult.ok(updated);
  }

  async deleteDeal(
    tenantId: string,
    dealId: string,
  ): Promise<ServiceResult<unknown>> {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { tenantId },
    });

    if (!profile) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Provider profile not found');
    }

    const deal = await this.prisma.deal.findFirst({
      where: { id: dealId, providerProfileId: profile.id },
    });

    if (!deal) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Deal not found');
    }

    await this.prisma.deal.update({
      where: { id: dealId },
      data: { isActive: false },
    });

    return ServiceResult.ok({ deleted: true });
  }

  // === Public Endpoints ===

  async listActiveDeals(filters: {
    country?: string;
    city?: string;
    category?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ServiceResult<PaginatedResult<unknown>>> {
    const page = filters.page ?? 1;
    const pageSize = Math.min(filters.pageSize ?? 20, 100);

    const now = new Date();
    const where: Record<string, unknown> = {
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: now } },
      ],
    };

    // Build provider profile filter for location/category
    const profileWhere: Record<string, unknown> = {};
    if (filters.country) {
      profileWhere.country = { equals: filters.country, mode: 'insensitive' };
    }
    if (filters.city) {
      profileWhere.city = { equals: filters.city, mode: 'insensitive' };
    }
    if (filters.category) {
      const slugs = filters.category.split(',').map((s) => s.trim()).filter(Boolean);
      const categories = await this.prisma.category.findMany({
        where: { slug: { in: slugs }, isActive: true },
        include: { children: { where: { isActive: true }, select: { id: true } } },
      });
      const categoryIds: string[] = [];
      for (const cat of categories) {
        categoryIds.push(cat.id);
        if (cat.children.length > 0) {
          categoryIds.push(...cat.children.map((c) => c.id));
        }
      }
      if (categoryIds.length > 0) {
        profileWhere.categories = {
          some: { categoryId: { in: categoryIds } },
        };
      }
    }

    if (Object.keys(profileWhere).length > 0) {
      where.providerProfile = profileWhere;
    }

    const [items, totalCount] = await Promise.all([
      this.prisma.deal.findMany({
        where,
        include: {
          providerProfile: {
            select: {
              id: true,
              bio: true,
              city: true,
              country: true,
              coverImageUrl: true,
              isVerified: true,
              tenant: { select: { id: true, name: true, slug: true } },
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.deal.count({ where }),
    ]);

    const mapped = items.map((deal: any) => ({
      id: deal.id,
      title: deal.title,
      description: deal.description || '',
      discountPercent: deal.discountPercent,
      originalPrice: deal.originalPrice ? Number(deal.originalPrice) : null,
      dealPrice: deal.dealPrice ? Number(deal.dealPrice) : null,
      imageUrl: deal.imageUrl,
      startsAt: deal.startsAt,
      expiresAt: deal.expiresAt,
      createdAt: deal.createdAt,
      provider: {
        id: deal.providerProfile.id,
        name: deal.providerProfile.tenant?.name || 'Unnamed',
        slug: deal.providerProfile.tenant?.slug || deal.providerProfile.id,
        city: deal.providerProfile.city || '',
        country: deal.providerProfile.country || '',
        coverPhoto: deal.providerProfile.coverImageUrl,
        verified: deal.providerProfile.isVerified || false,
      },
    }));

    return ServiceResult.ok(paginate(mapped, totalCount, { page, pageSize }));
  }

  async getFeaturedDeals(): Promise<ServiceResult<unknown>> {
    const now = new Date();

    const deals = await this.prisma.deal.findMany({
      where: {
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
      include: {
        providerProfile: {
          select: {
            id: true,
            bio: true,
            city: true,
            country: true,
            coverImageUrl: true,
            isVerified: true,
            tenant: { select: { id: true, name: true, slug: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const mapped = deals.map((deal: any) => ({
      id: deal.id,
      title: deal.title,
      description: deal.description || '',
      discountPercent: deal.discountPercent,
      originalPrice: deal.originalPrice ? Number(deal.originalPrice) : null,
      dealPrice: deal.dealPrice ? Number(deal.dealPrice) : null,
      imageUrl: deal.imageUrl,
      startsAt: deal.startsAt,
      expiresAt: deal.expiresAt,
      createdAt: deal.createdAt,
      provider: {
        id: deal.providerProfile.id,
        name: deal.providerProfile.tenant?.name || 'Unnamed',
        slug: deal.providerProfile.tenant?.slug || deal.providerProfile.id,
        city: deal.providerProfile.city || '',
        country: deal.providerProfile.country || '',
        coverPhoto: deal.providerProfile.coverImageUrl,
        verified: deal.providerProfile.isVerified || false,
      },
    }));

    return ServiceResult.ok(mapped);
  }

  async getDealById(dealId: string): Promise<ServiceResult<unknown>> {
    const deal = await this.prisma.deal.findFirst({
      where: {
        id: dealId,
        isActive: true,
      },
      include: {
        providerProfile: {
          select: {
            id: true,
            bio: true,
            city: true,
            country: true,
            coverImageUrl: true,
            isVerified: true,
            whatsapp: true,
            phone: true,
            email: true,
            tenant: { select: { id: true, name: true, slug: true } },
            categories: { include: { category: true } },
          },
        },
      },
    });

    if (!deal) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Deal not found');
    }

    const d = deal as any;
    return ServiceResult.ok({
      id: d.id,
      title: d.title,
      description: d.description || '',
      discountPercent: d.discountPercent,
      originalPrice: d.originalPrice ? Number(d.originalPrice) : null,
      dealPrice: d.dealPrice ? Number(d.dealPrice) : null,
      imageUrl: d.imageUrl,
      startsAt: d.startsAt,
      expiresAt: d.expiresAt,
      createdAt: d.createdAt,
      provider: {
        id: d.providerProfile.id,
        name: d.providerProfile.tenant?.name || 'Unnamed',
        slug: d.providerProfile.tenant?.slug || d.providerProfile.id,
        city: d.providerProfile.city || '',
        country: d.providerProfile.country || '',
        coverPhoto: d.providerProfile.coverImageUrl,
        verified: d.providerProfile.isVerified || false,
        whatsapp: d.providerProfile.whatsapp || '',
        phone: d.providerProfile.phone || '',
        email: d.providerProfile.email || '',
        categories: (d.providerProfile.categories || []).map((pc: any) => ({
          id: pc.category.id,
          name: pc.category.name,
          slug: pc.category.slug,
        })),
      },
    });
  }

  // === Expiry Job ===

  async expireDeals(): Promise<number> {
    const now = new Date();

    const result = await this.prisma.deal.updateMany({
      where: {
        isActive: true,
        expiresAt: { lt: now },
      },
      data: { isActive: false },
    });

    this.logger.log(`Expired ${result.count} deals`);
    return result.count;
  }
}
