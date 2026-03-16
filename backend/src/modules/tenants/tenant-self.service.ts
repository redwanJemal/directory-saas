import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { ServiceResult } from '../../common/types';
import { ErrorCodes } from '../../common/constants/error-codes';
import { PaginatedResult, paginate } from '../../common/dto/pagination.dto';
import { InviteUserDto, ChangeRoleDto } from './dto/tenant-self.dto';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class TenantSelfService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers(
    tenantId: string,
    page: number,
    pageSize: number,
    search?: string,
  ): Promise<ServiceResult<PaginatedResult<unknown>>> {
    const where: Prisma.TenantUserWhereInput = {
      tenantId,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      this.prisma.tenantUser.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          avatarUrl: true,
          lastLoginAt: true,
          createdAt: true,
          roleAssignments: {
            include: {
              role: {
                select: { id: true, name: true, displayName: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.tenantUser.count({ where }),
    ]);

    // Map to frontend-friendly shape
    const mapped = items.map((user) => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      role: user.roleAssignments[0]?.role?.name ?? user.role,
      status: user.isActive ? 'active' : 'inactive',
      joinedAt: user.createdAt.toISOString(),
      avatarUrl: user.avatarUrl,
    }));

    return ServiceResult.ok(paginate(mapped, total, { page, pageSize }));
  }

  async listRoles(tenantId: string): Promise<ServiceResult<unknown>> {
    const roles = await this.prisma.role.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        displayName: true,
        description: true,
        isSystem: true,
        _count: { select: { permissions: true, users: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return ServiceResult.ok(roles);
  }

  async inviteUser(
    tenantId: string,
    dto: InviteUserDto,
  ): Promise<ServiceResult<unknown>> {
    // Check if email already exists in this tenant
    const existing = await this.prisma.tenantUser.findUnique({
      where: { tenantId_email: { tenantId, email: dto.email } },
    });

    if (existing) {
      return ServiceResult.fail(
        ErrorCodes.ALREADY_EXISTS,
        `User with email '${dto.email}' already exists in this tenant`,
      );
    }

    // Generate a random temporary password
    const tempPassword = Math.random().toString(36).slice(-12) + 'A1!';
    const passwordHash = await bcrypt.hash(tempPassword, BCRYPT_ROUNDS);

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.tenantUser.create({
        data: {
          tenantId,
          email: dto.email,
          firstName: dto.firstName ?? '',
          lastName: dto.lastName ?? '',
          passwordHash,
          isActive: true,
          role: 'MEMBER',
        },
      });

      // Assign role if provided
      if (dto.roleId) {
        const role = await tx.role.findFirst({
          where: { id: dto.roleId, tenantId },
        });
        if (role) {
          await tx.userRole.create({
            data: { userId: created.id, roleId: role.id },
          });
        }
      }

      return tx.tenantUser.findUnique({
        where: { id: created.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          avatarUrl: true,
          createdAt: true,
          roleAssignments: {
            include: {
              role: {
                select: { id: true, name: true, displayName: true },
              },
            },
          },
        },
      });
    });

    if (!user) {
      return ServiceResult.fail(ErrorCodes.INTERNAL_ERROR, 'Failed to create user');
    }

    return ServiceResult.ok({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      role: user.roleAssignments[0]?.role?.name ?? user.role,
      status: user.isActive ? 'active' : 'inactive',
      joinedAt: user.createdAt.toISOString(),
      avatarUrl: user.avatarUrl,
    });
  }

  async changeUserRole(
    tenantId: string,
    userId: string,
    dto: ChangeRoleDto,
  ): Promise<ServiceResult<unknown>> {
    const user = await this.prisma.tenantUser.findFirst({
      where: { id: userId, tenantId, deletedAt: null },
    });

    if (!user) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'User not found in this tenant');
    }

    // Verify role belongs to this tenant
    const role = await this.prisma.role.findFirst({
      where: { id: dto.roleId, tenantId },
    });

    if (!role) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Role not found in this tenant');
    }

    // Replace all role assignments for this user with the new role
    await this.prisma.$transaction([
      this.prisma.userRole.deleteMany({ where: { userId } }),
      this.prisma.userRole.create({
        data: { userId, roleId: dto.roleId },
      }),
    ]);

    const updated = await this.prisma.tenantUser.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        avatarUrl: true,
        createdAt: true,
        roleAssignments: {
          include: {
            role: {
              select: { id: true, name: true, displayName: true },
            },
          },
        },
      },
    });

    if (!updated) {
      return ServiceResult.fail(ErrorCodes.INTERNAL_ERROR, 'Failed to update user');
    }

    return ServiceResult.ok({
      id: updated.id,
      name: `${updated.firstName} ${updated.lastName}`.trim(),
      email: updated.email,
      role: updated.roleAssignments[0]?.role?.name ?? updated.role,
      status: updated.isActive ? 'active' : 'inactive',
      joinedAt: updated.createdAt.toISOString(),
      avatarUrl: updated.avatarUrl,
    });
  }

  async removeUser(
    tenantId: string,
    userId: string,
  ): Promise<ServiceResult<unknown>> {
    const user = await this.prisma.tenantUser.findFirst({
      where: { id: userId, tenantId, deletedAt: null },
    });

    if (!user) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'User not found in this tenant');
    }

    // Soft delete: set isActive=false and deletedAt
    await this.prisma.tenantUser.update({
      where: { id: userId },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    return ServiceResult.ok({ deleted: true });
  }
}
