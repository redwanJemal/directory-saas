import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ServiceResult } from '../../common/types';
import { ErrorCodes } from '../../common/constants/error-codes';
import { CreateRoleDto, UpdateRoleDto, SetPermissionsDto, AssignRolesDto } from './dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { DEFAULT_ROLES, PERMISSIONS } from './permissions.seed';

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rolesGuard: RolesGuard,
  ) {}

  async create(tenantId: string, dto: CreateRoleDto): Promise<ServiceResult<unknown>> {
    const existing = await this.prisma.role.findUnique({
      where: { tenantId_name: { tenantId, name: dto.name } },
    });
    if (existing) {
      return ServiceResult.fail(ErrorCodes.ALREADY_EXISTS, `Role '${dto.name}' already exists`);
    }

    const role = await this.prisma.role.create({
      data: {
        tenantId,
        name: dto.name,
        displayName: dto.displayName,
        description: dto.description,
      },
    });

    return ServiceResult.ok(role);
  }

  async findAll(tenantId: string): Promise<ServiceResult<unknown>> {
    const roles = await this.prisma.role.findMany({
      where: { tenantId },
      include: {
        permissions: {
          include: { permission: true },
        },
        _count: { select: { users: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return ServiceResult.ok(roles);
  }

  async findOne(tenantId: string, id: string): Promise<ServiceResult<unknown>> {
    const role = await this.prisma.role.findFirst({
      where: { id, tenantId },
      include: {
        permissions: {
          include: { permission: true },
        },
        users: {
          include: {
            user: {
              select: { id: true, email: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });

    if (!role) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Role not found');
    }

    return ServiceResult.ok(role);
  }

  async update(tenantId: string, id: string, dto: UpdateRoleDto): Promise<ServiceResult<unknown>> {
    const role = await this.prisma.role.findFirst({
      where: { id, tenantId },
    });

    if (!role) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Role not found');
    }

    if (role.isSystem && dto.name && dto.name !== role.name) {
      return ServiceResult.fail(ErrorCodes.FORBIDDEN, 'Cannot rename system roles');
    }

    // Check for name uniqueness if name is being changed
    if (dto.name && dto.name !== role.name) {
      const existing = await this.prisma.role.findUnique({
        where: { tenantId_name: { tenantId, name: dto.name } },
      });
      if (existing) {
        return ServiceResult.fail(ErrorCodes.ALREADY_EXISTS, `Role '${dto.name}' already exists`);
      }
    }

    const updated = await this.prisma.role.update({
      where: { id },
      data: dto,
    });

    return ServiceResult.ok(updated);
  }

  async delete(tenantId: string, id: string): Promise<ServiceResult<unknown>> {
    const role = await this.prisma.role.findFirst({
      where: { id, tenantId },
    });

    if (!role) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Role not found');
    }

    if (role.isSystem) {
      return ServiceResult.fail(ErrorCodes.FORBIDDEN, 'Cannot delete system roles');
    }

    await this.prisma.role.delete({ where: { id } });

    // Invalidate all permission caches since role deletion affects permissions
    this.rolesGuard.invalidateAllCache();

    return ServiceResult.ok({ deleted: true });
  }

  async setPermissions(
    tenantId: string,
    roleId: string,
    dto: SetPermissionsDto,
  ): Promise<ServiceResult<unknown>> {
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, tenantId },
    });

    if (!role) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Role not found');
    }

    // Validate that all permission IDs exist
    const permissions = await this.prisma.permission.findMany({
      where: { id: { in: dto.permissionIds } },
    });

    if (permissions.length !== dto.permissionIds.length) {
      return ServiceResult.fail(
        ErrorCodes.INVALID_INPUT,
        'One or more permission IDs are invalid',
      );
    }

    // Replace all permissions for this role
    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId } }),
      ...dto.permissionIds.map((permissionId) =>
        this.prisma.rolePermission.create({
          data: { roleId, permissionId },
        }),
      ),
    ]);

    // Invalidate all caches since this affects all users with this role
    this.rolesGuard.invalidateAllCache();

    const updated = await this.prisma.role.findFirst({
      where: { id: roleId },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });

    return ServiceResult.ok(updated);
  }

  async assignRolesToUser(
    tenantId: string,
    userId: string,
    dto: AssignRolesDto,
  ): Promise<ServiceResult<unknown>> {
    // Verify user belongs to this tenant
    const user = await this.prisma.tenantUser.findFirst({
      where: { id: userId, tenantId },
    });

    if (!user) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'User not found in this tenant');
    }

    // Verify all roles belong to this tenant
    const roles = await this.prisma.role.findMany({
      where: { id: { in: dto.roleIds }, tenantId },
    });

    if (roles.length !== dto.roleIds.length) {
      return ServiceResult.fail(
        ErrorCodes.INVALID_INPUT,
        'One or more role IDs are invalid or do not belong to this tenant',
      );
    }

    // Replace all role assignments for this user
    await this.prisma.$transaction([
      this.prisma.userRole.deleteMany({ where: { userId } }),
      ...dto.roleIds.map((roleId) =>
        this.prisma.userRole.create({
          data: { userId, roleId },
        }),
      ),
    ]);

    // Invalidate this user's permission cache
    this.rolesGuard.invalidateCache(userId);

    const updatedUser = await this.prisma.tenantUser.findFirst({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        roleAssignments: {
          include: {
            role: {
              select: { id: true, name: true, displayName: true },
            },
          },
        },
      },
    });

    return ServiceResult.ok(updatedUser);
  }

  async listPermissions(): Promise<ServiceResult<unknown>> {
    const permissions = await this.prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });
    return ServiceResult.ok(permissions);
  }

  async seedPermissions(): Promise<void> {
    for (const perm of PERMISSIONS) {
      const existing = await this.prisma.permission.findUnique({
        where: { resource_action: { resource: perm.resource, action: perm.action } },
      });
      if (!existing) {
        await this.prisma.permission.create({
          data: {
            resource: perm.resource,
            action: perm.action,
            description: perm.description,
          },
        });
      }
    }
  }

  async createDefaultRolesForTenant(tenantId: string): Promise<void> {
    for (const roleDef of DEFAULT_ROLES) {
      const existing = await this.prisma.role.findUnique({
        where: { tenantId_name: { tenantId, name: roleDef.name } },
      });
      if (existing) continue;

      const role = await this.prisma.role.create({
        data: {
          tenantId,
          name: roleDef.name,
          displayName: roleDef.displayName,
          description: roleDef.description,
          isSystem: roleDef.isSystem,
        },
      });

      // Assign permissions to this role
      for (const permStr of roleDef.permissions) {
        const [resource, action] = permStr.split(':');
        const permission = await this.prisma.permission.findUnique({
          where: { resource_action: { resource, action } },
        });
        if (permission) {
          await this.prisma.rolePermission.create({
            data: { roleId: role.id, permissionId: permission.id },
          });
        }
      }
    }
  }
}
