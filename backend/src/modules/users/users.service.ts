import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ServiceResult } from '../../common/types';
import { PaginatedResult, paginate } from '../../common/dto/pagination.dto';
import { ErrorCodes } from '../../common/constants/error-codes';

interface UnifiedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  type: 'admin' | 'tenant' | 'client';
  isActive: boolean;
  createdAt: Date;
  tenantId?: string;
  tenantName?: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers(
    page: number,
    pageSize: number,
    type?: 'admin' | 'tenant' | 'client',
  ): Promise<ServiceResult<PaginatedResult<UnifiedUser>>> {
    const users: UnifiedUser[] = [];
    let totalCount = 0;

    if (!type || type === 'admin') {
      const [admins, count] = await Promise.all([
        this.prisma.adminUser.findMany({
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true,
            createdAt: true,
          },
        }),
        this.prisma.adminUser.count(),
      ]);
      users.push(
        ...admins.map((u) => ({ ...u, type: 'admin' as const })),
      );
      totalCount += count;
    }

    if (!type || type === 'tenant') {
      const [tenantUsers, count] = await Promise.all([
        this.prisma.tenantUser.findMany({
          where: { deletedAt: null },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true,
            createdAt: true,
            tenantId: true,
            tenant: { select: { name: true } },
          },
        }),
        this.prisma.tenantUser.count({ where: { deletedAt: null } }),
      ]);
      users.push(
        ...tenantUsers.map((u) => ({
          id: u.id,
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
          type: 'tenant' as const,
          isActive: u.isActive,
          createdAt: u.createdAt,
          tenantId: u.tenantId,
          tenantName: u.tenant.name,
        })),
      );
      totalCount += count;
    }

    if (!type || type === 'client') {
      const [clients, count] = await Promise.all([
        this.prisma.clientUser.findMany({
          where: { deletedAt: null },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true,
            createdAt: true,
          },
        }),
        this.prisma.clientUser.count({ where: { deletedAt: null } }),
      ]);
      users.push(
        ...clients.map((u) => ({ ...u, type: 'client' as const })),
      );
      totalCount += count;
    }

    // Sort by createdAt descending
    users.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Apply pagination in-memory (across combined tables)
    const offset = (page - 1) * pageSize;
    const paginatedUsers = users.slice(offset, offset + pageSize);

    return ServiceResult.ok(paginate(paginatedUsers, totalCount, { page, pageSize }));
  }

  async getUserById(id: string): Promise<ServiceResult<UnifiedUser>> {
    // Try AdminUser first
    const admin = await this.prisma.adminUser.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
      },
    });
    if (admin) {
      return ServiceResult.ok({ ...admin, type: 'admin' as const });
    }

    // Try TenantUser
    const tenantUser = await this.prisma.tenantUser.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
        tenantId: true,
        tenant: { select: { name: true } },
      },
    });
    if (tenantUser) {
      return ServiceResult.ok({
        id: tenantUser.id,
        email: tenantUser.email,
        firstName: tenantUser.firstName,
        lastName: tenantUser.lastName,
        type: 'tenant' as const,
        isActive: tenantUser.isActive,
        createdAt: tenantUser.createdAt,
        tenantId: tenantUser.tenantId,
        tenantName: tenantUser.tenant.name,
      });
    }

    // Try ClientUser
    const client = await this.prisma.clientUser.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
      },
    });
    if (client) {
      return ServiceResult.ok({ ...client, type: 'client' as const });
    }

    return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'User not found');
  }
}
