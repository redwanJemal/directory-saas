import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ServiceResult } from '../../common/types';
import { ErrorCodes } from '../../common/constants/error-codes';
import { PaginatedResult, paginate } from '../../common/dto/pagination.dto';
import { CreateTenantDto, UpdateTenantDto } from './dto';

interface TenantListFilters {
  status?: string;
  search?: string;
}

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async listTenants(
    page: number,
    pageSize: number,
    filters?: TenantListFilters,
  ): Promise<ServiceResult<PaginatedResult<unknown>>> {
    const where: Prisma.TenantWhereInput = {
      deletedAt: null,
    };

    if (filters?.status) {
      where.status = filters.status as Prisma.EnumTenantStatusFilter;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { slug: { contains: filters.search, mode: 'insensitive' } },
        { domain: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        include: {
          subscription: {
            include: { plan: true },
          },
          _count: {
            select: { users: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return ServiceResult.ok(paginate(items, total, { page, pageSize }));
  }

  async getTenantById(id: string): Promise<ServiceResult<unknown>> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        subscription: {
          include: { plan: true },
        },
        _count: {
          select: { users: true },
        },
      },
    });

    if (!tenant || tenant.deletedAt) {
      return ServiceResult.fail(ErrorCodes.TENANT_NOT_FOUND, 'Tenant not found');
    }

    return ServiceResult.ok(tenant);
  }

  async createTenant(dto: CreateTenantDto): Promise<ServiceResult<unknown>> {
    // Check slug uniqueness
    const existingSlug = await this.prisma.tenant.findUnique({
      where: { slug: dto.slug },
    });
    if (existingSlug) {
      return ServiceResult.fail(
        ErrorCodes.ALREADY_EXISTS,
        `Tenant with slug '${dto.slug}' already exists`,
      );
    }

    // Check domain uniqueness if provided
    if (dto.domain) {
      const existingDomain = await this.prisma.tenant.findUnique({
        where: { domain: dto.domain },
      });
      if (existingDomain) {
        return ServiceResult.fail(
          ErrorCodes.ALREADY_EXISTS,
          `Tenant with domain '${dto.domain}' already exists`,
        );
      }
    }

    // Create tenant + auto-assign starter plan if available
    const tenant = await this.prisma.$transaction(async (tx) => {
      const created = await tx.tenant.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          domain: dto.domain,
          logoUrl: dto.logoUrl,
          primaryColor: dto.primaryColor,
          secondaryColor: dto.secondaryColor,
          settings: dto.settings ?? {},
        },
      });

      // Auto-create starter subscription if a starter plan exists
      const starterPlan = await tx.subscriptionPlan.findFirst({
        where: {
          name: 'starter',
          isActive: true,
        },
      });

      if (starterPlan) {
        await tx.tenantSubscription.create({
          data: {
            tenantId: created.id,
            planId: starterPlan.id,
            status: 'ACTIVE',
            startedAt: new Date(),
          },
        });
      }

      return tx.tenant.findUnique({
        where: { id: created.id },
        include: {
          subscription: {
            include: { plan: true },
          },
          _count: {
            select: { users: true },
          },
        },
      });
    });

    return ServiceResult.ok(tenant);
  }

  async updateTenant(id: string, dto: UpdateTenantDto): Promise<ServiceResult<unknown>> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant || tenant.deletedAt) {
      return ServiceResult.fail(ErrorCodes.TENANT_NOT_FOUND, 'Tenant not found');
    }

    // Check slug uniqueness if slug is being changed
    if (dto.slug && dto.slug !== tenant.slug) {
      const existingSlug = await this.prisma.tenant.findUnique({
        where: { slug: dto.slug },
      });
      if (existingSlug) {
        return ServiceResult.fail(
          ErrorCodes.ALREADY_EXISTS,
          `Tenant with slug '${dto.slug}' already exists`,
        );
      }
    }

    // Check domain uniqueness if domain is being changed
    if (dto.domain && dto.domain !== tenant.domain) {
      const existingDomain = await this.prisma.tenant.findUnique({
        where: { domain: dto.domain },
      });
      if (existingDomain) {
        return ServiceResult.fail(
          ErrorCodes.ALREADY_EXISTS,
          `Tenant with domain '${dto.domain}' already exists`,
        );
      }
    }

    const updated = await this.prisma.tenant.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.domain !== undefined && { domain: dto.domain }),
        ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
        ...(dto.primaryColor !== undefined && { primaryColor: dto.primaryColor }),
        ...(dto.secondaryColor !== undefined && { secondaryColor: dto.secondaryColor }),
        ...(dto.settings !== undefined && { settings: dto.settings }),
      },
      include: {
        subscription: {
          include: { plan: true },
        },
        _count: {
          select: { users: true },
        },
      },
    });

    return ServiceResult.ok(updated);
  }

  async suspendTenant(id: string, suspend: boolean): Promise<ServiceResult<unknown>> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant || tenant.deletedAt) {
      return ServiceResult.fail(ErrorCodes.TENANT_NOT_FOUND, 'Tenant not found');
    }

    const targetStatus = suspend ? 'SUSPENDED' : 'ACTIVE';

    if (tenant.status === targetStatus) {
      return ServiceResult.fail(
        ErrorCodes.CONFLICT,
        `Tenant is already ${targetStatus.toLowerCase()}`,
      );
    }

    const updated = await this.prisma.tenant.update({
      where: { id },
      data: { status: targetStatus },
      include: {
        subscription: {
          include: { plan: true },
        },
        _count: {
          select: { users: true },
        },
      },
    });

    return ServiceResult.ok(updated);
  }
}
