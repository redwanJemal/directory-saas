import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { AppException } from '../exceptions/app.exception';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let prisma: any;

  const createMockContext = (user: any): ExecutionContext =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = new Reflector();
    prisma = {
      userRole: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    guard = new RolesGuard(reflector, prisma);
  });

  afterEach(() => {
    guard.invalidateAllCache();
  });

  describe('canActivate', () => {
    it('should allow access for @Public() routes', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: string) => {
        if (key === IS_PUBLIC_KEY) return true;
        return undefined;
      });

      const context = createMockContext(null);
      expect(await guard.canActivate(context)).toBe(true);
    });

    it('should allow access when no roles or permissions are required', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const context = createMockContext({ sub: '1', userType: 'tenant' });
      expect(await guard.canActivate(context)).toBe(true);
    });

    it('should throw UNAUTHORIZED when no user is present', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: string) => {
        if (key === IS_PUBLIC_KEY) return false;
        if (key === ROLES_KEY) return ['OWNER'];
        return undefined;
      });

      const context = createMockContext(null);
      await expect(guard.canActivate(context)).rejects.toThrow(AppException);
    });

    it('should allow admin users through role checks', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: string) => {
        if (key === IS_PUBLIC_KEY) return false;
        if (key === ROLES_KEY) return ['SUPER_ADMIN'];
        return undefined;
      });

      const context = createMockContext({ sub: '1', userType: 'admin' });
      expect(await guard.canActivate(context)).toBe(true);
    });

    it('should deny client users when roles are required', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: string) => {
        if (key === IS_PUBLIC_KEY) return false;
        if (key === ROLES_KEY) return ['OWNER'];
        return undefined;
      });

      const context = createMockContext({ sub: '1', userType: 'client' });
      await expect(guard.canActivate(context)).rejects.toThrow(AppException);
    });

    it('should allow tenant user with correct role', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: string) => {
        if (key === IS_PUBLIC_KEY) return false;
        if (key === ROLES_KEY) return ['OWNER', 'ADMIN'];
        if (key === PERMISSION_KEY) return undefined;
        return undefined;
      });

      prisma.userRole.findMany.mockResolvedValue([
        {
          role: {
            name: 'OWNER',
            permissions: [
              { permission: { resource: 'users', action: 'manage' } },
            ],
          },
        },
      ]);

      const context = createMockContext({ sub: 'user1', userType: 'tenant', tenantId: 't1' });
      expect(await guard.canActivate(context)).toBe(true);
    });

    it('should deny tenant user with wrong role', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: string) => {
        if (key === IS_PUBLIC_KEY) return false;
        if (key === ROLES_KEY) return ['OWNER'];
        if (key === PERMISSION_KEY) return undefined;
        return undefined;
      });

      prisma.userRole.findMany.mockResolvedValue([
        {
          role: {
            name: 'MEMBER',
            permissions: [],
          },
        },
      ]);

      const context = createMockContext({ sub: 'user2', userType: 'tenant', tenantId: 't1' });
      await expect(guard.canActivate(context)).rejects.toThrow(AppException);
    });

    it('should allow tenant user with correct permission', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: string) => {
        if (key === IS_PUBLIC_KEY) return false;
        if (key === ROLES_KEY) return undefined;
        if (key === PERMISSION_KEY) return 'users:create';
        return undefined;
      });

      prisma.userRole.findMany.mockResolvedValue([
        {
          role: {
            name: 'ADMIN',
            permissions: [
              { permission: { resource: 'users', action: 'create' } },
              { permission: { resource: 'users', action: 'read' } },
            ],
          },
        },
      ]);

      const context = createMockContext({ sub: 'user3', userType: 'tenant', tenantId: 't1' });
      expect(await guard.canActivate(context)).toBe(true);
    });

    it('should deny tenant user without correct permission', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: string) => {
        if (key === IS_PUBLIC_KEY) return false;
        if (key === ROLES_KEY) return undefined;
        if (key === PERMISSION_KEY) return 'users:delete';
        return undefined;
      });

      prisma.userRole.findMany.mockResolvedValue([
        {
          role: {
            name: 'MEMBER',
            permissions: [
              { permission: { resource: 'users', action: 'read' } },
            ],
          },
        },
      ]);

      const context = createMockContext({ sub: 'user4', userType: 'tenant', tenantId: 't1' });
      await expect(guard.canActivate(context)).rejects.toThrow(AppException);
    });

    it('should allow access when user has manage permission (wildcard)', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: string) => {
        if (key === IS_PUBLIC_KEY) return false;
        if (key === ROLES_KEY) return undefined;
        if (key === PERMISSION_KEY) return 'users:delete';
        return undefined;
      });

      prisma.userRole.findMany.mockResolvedValue([
        {
          role: {
            name: 'OWNER',
            permissions: [
              { permission: { resource: 'users', action: 'manage' } },
            ],
          },
        },
      ]);

      const context = createMockContext({ sub: 'user5', userType: 'tenant', tenantId: 't1' });
      expect(await guard.canActivate(context)).toBe(true);
    });
  });

  describe('permission caching', () => {
    it('should cache permissions and not query DB on second call', async () => {
      prisma.userRole.findMany.mockResolvedValue([
        {
          role: {
            name: 'ADMIN',
            permissions: [
              { permission: { resource: 'users', action: 'read' } },
            ],
          },
        },
      ]);

      await guard.getUserPermissions('user-cached');
      await guard.getUserPermissions('user-cached');

      expect(prisma.userRole.findMany).toHaveBeenCalledTimes(1);
    });

    it('should invalidate cache for specific user', async () => {
      prisma.userRole.findMany.mockResolvedValue([
        {
          role: {
            name: 'ADMIN',
            permissions: [
              { permission: { resource: 'users', action: 'read' } },
            ],
          },
        },
      ]);

      await guard.getUserPermissions('user-inv');
      guard.invalidateCache('user-inv');
      await guard.getUserPermissions('user-inv');

      expect(prisma.userRole.findMany).toHaveBeenCalledTimes(2);
    });

    it('should invalidate all cache entries', async () => {
      prisma.userRole.findMany.mockResolvedValue([
        {
          role: { name: 'ADMIN', permissions: [] },
        },
      ]);

      await guard.getUserPermissions('u1');
      await guard.getUserPermissions('u2');
      guard.invalidateAllCache();
      await guard.getUserPermissions('u1');
      await guard.getUserPermissions('u2');

      // 2 initial + 2 after invalidation = 4
      expect(prisma.userRole.findMany).toHaveBeenCalledTimes(4);
    });
  });
});
