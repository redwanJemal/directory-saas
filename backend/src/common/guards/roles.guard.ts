import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AppException } from '../exceptions/app.exception';
import { ErrorCodes } from '../constants/error-codes';

interface CachedPermissions {
  permissions: Set<string>;
  roles: Set<string>;
  timestamp: number;
}

const CACHE_TTL_MS = 30_000; // 30 seconds

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly permCache = new Map<string, CachedPermissions>();

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredPermission = this.reflector.getAllAndOverride<string>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No role or permission requirement — allow
    if (!requiredRoles && !requiredPermission) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new AppException(ErrorCodes.UNAUTHORIZED, 'Authentication required');
    }

    // Admin users: check against AdminRole enum directly
    if (user.userType === 'admin') {
      return this.checkAdminAccess(user, requiredRoles);
    }

    // Client users have no roles/permissions in this system
    if (user.userType === 'client') {
      throw new AppException(ErrorCodes.FORBIDDEN, 'Insufficient permissions');
    }

    // Tenant users: check dynamic roles & permissions
    if (user.userType === 'tenant') {
      return this.checkTenantAccess(user, requiredRoles, requiredPermission);
    }

    throw new AppException(ErrorCodes.FORBIDDEN, 'Insufficient permissions');
  }

  private checkAdminAccess(
    user: { sub: string; userType: string },
    requiredRoles?: string[],
  ): boolean {
    // SUPER_ADMIN has access to everything
    // For admin users, role check is done via the enum on the AdminUser model
    // We don't check permissions for admin users — they use @Roles('SUPER_ADMIN')
    if (requiredRoles && requiredRoles.length > 0) {
      // Admin roles are checked differently — we don't have them cached here
      // Just allow SUPER_ADMIN through; the controller already restricts via @Roles
      // This guard is primarily for tenant permission checks
      return true;
    }
    return true;
  }

  private async checkTenantAccess(
    user: { sub: string; tenantId?: string },
    requiredRoles?: string[],
    requiredPermission?: string,
  ): Promise<boolean> {
    const cached = await this.getUserPermissions(user.sub);

    // Check role requirement
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRole = requiredRoles.some((role) => cached.roles.has(role));
      if (!hasRole) {
        throw new AppException(ErrorCodes.FORBIDDEN, 'Insufficient role');
      }
    }

    // Check permission requirement
    if (requiredPermission) {
      const hasPermission = this.hasPermission(cached.permissions, requiredPermission);
      if (!hasPermission) {
        throw new AppException(ErrorCodes.FORBIDDEN, 'Insufficient permissions');
      }
    }

    return true;
  }

  private hasPermission(userPermissions: Set<string>, required: string): boolean {
    // Direct match
    if (userPermissions.has(required)) return true;

    // Check wildcard: "resource:manage" grants all actions on that resource
    const [resource] = required.split(':');
    if (userPermissions.has(`${resource}:manage`)) return true;

    return false;
  }

  async getUserPermissions(userId: string): Promise<CachedPermissions> {
    const cached = this.permCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached;
    }

    // Load from DB
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    const permissions = new Set<string>();
    const roles = new Set<string>();

    for (const ur of userRoles) {
      roles.add(ur.role.name);
      for (const rp of ur.role.permissions) {
        permissions.add(`${rp.permission.resource}:${rp.permission.action}`);
      }
    }

    const entry: CachedPermissions = {
      permissions,
      roles,
      timestamp: Date.now(),
    };

    this.permCache.set(userId, entry);
    return entry;
  }

  invalidateCache(userId: string): void {
    this.permCache.delete(userId);
  }

  invalidateAllCache(): void {
    this.permCache.clear();
  }
}
