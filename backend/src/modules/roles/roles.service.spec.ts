import { RolesService } from './roles.service';
import { RolesGuard } from '../../common/guards/roles.guard';

describe('RolesService', () => {
  let service: RolesService;
  let prisma: any;
  let rolesGuard: any;

  const tenantId = 'tenant-uuid-1';

  beforeEach(() => {
    prisma = {
      role: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      permission: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
      },
      rolePermission: {
        deleteMany: jest.fn(),
        create: jest.fn(),
      },
      userRole: {
        deleteMany: jest.fn(),
        create: jest.fn(),
      },
      tenantUser: {
        findFirst: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation((ops) => Promise.all(ops)),
    };

    rolesGuard = {
      invalidateCache: jest.fn(),
      invalidateAllCache: jest.fn(),
    };

    service = new RolesService(prisma, rolesGuard as unknown as RolesGuard);
  });

  describe('create', () => {
    it('should create a role successfully', async () => {
      prisma.role.findUnique.mockResolvedValue(null);
      const created = { id: 'role-1', tenantId, name: 'CUSTOM', displayName: 'Custom' };
      prisma.role.create.mockResolvedValue(created);

      const result = await service.create(tenantId, {
        name: 'CUSTOM',
        displayName: 'Custom',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(created);
    });

    it('should fail if role name already exists', async () => {
      prisma.role.findUnique.mockResolvedValue({ id: 'existing' });

      const result = await service.create(tenantId, {
        name: 'EXISTING',
        displayName: 'Existing',
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('ALREADY_EXISTS');
    });
  });

  describe('findAll', () => {
    it('should return all roles for a tenant', async () => {
      const roles = [
        { id: 'r1', name: 'OWNER', permissions: [], _count: { users: 2 } },
        { id: 'r2', name: 'MEMBER', permissions: [], _count: { users: 5 } },
      ];
      prisma.role.findMany.mockResolvedValue(roles);

      const result = await service.findAll(tenantId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(roles);
    });
  });

  describe('findOne', () => {
    it('should return a role with permissions and users', async () => {
      const role = { id: 'r1', name: 'OWNER', permissions: [], users: [] };
      prisma.role.findFirst.mockResolvedValue(role);

      const result = await service.findOne(tenantId, 'r1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(role);
    });

    it('should fail if role not found', async () => {
      prisma.role.findFirst.mockResolvedValue(null);

      const result = await service.findOne(tenantId, 'nonexistent');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });
  });

  describe('update', () => {
    it('should update a role', async () => {
      prisma.role.findFirst.mockResolvedValue({ id: 'r1', name: 'CUSTOM', isSystem: false });
      const updated = { id: 'r1', name: 'CUSTOM', displayName: 'Updated Custom' };
      prisma.role.update.mockResolvedValue(updated);

      const result = await service.update(tenantId, 'r1', { displayName: 'Updated Custom' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updated);
    });

    it('should not allow renaming system roles', async () => {
      prisma.role.findFirst.mockResolvedValue({ id: 'r1', name: 'OWNER', isSystem: true });

      const result = await service.update(tenantId, 'r1', { name: 'RENAMED' });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('FORBIDDEN');
    });
  });

  describe('delete', () => {
    it('should delete a non-system role', async () => {
      prisma.role.findFirst.mockResolvedValue({ id: 'r1', name: 'CUSTOM', isSystem: false });
      prisma.role.delete.mockResolvedValue({});

      const result = await service.delete(tenantId, 'r1');

      expect(result.success).toBe(true);
      expect(rolesGuard.invalidateAllCache).toHaveBeenCalled();
    });

    it('should not allow deleting system roles', async () => {
      prisma.role.findFirst.mockResolvedValue({ id: 'r1', name: 'OWNER', isSystem: true });

      const result = await service.delete(tenantId, 'r1');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('FORBIDDEN');
    });

    it('should fail if role not found', async () => {
      prisma.role.findFirst.mockResolvedValue(null);

      const result = await service.delete(tenantId, 'nonexistent');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });
  });

  describe('setPermissions', () => {
    it('should set permissions for a role', async () => {
      prisma.role.findFirst
        .mockResolvedValueOnce({ id: 'r1', name: 'CUSTOM' })
        .mockResolvedValueOnce({ id: 'r1', permissions: [{ permission: { id: 'p1' } }] });
      prisma.permission.findMany.mockResolvedValue([{ id: 'p1' }, { id: 'p2' }]);
      prisma.rolePermission.deleteMany.mockResolvedValue({});
      prisma.rolePermission.create.mockResolvedValue({});

      const result = await service.setPermissions(tenantId, 'r1', {
        permissionIds: ['p1', 'p2'],
      });

      expect(result.success).toBe(true);
      expect(rolesGuard.invalidateAllCache).toHaveBeenCalled();
    });

    it('should fail if some permission IDs are invalid', async () => {
      prisma.role.findFirst.mockResolvedValue({ id: 'r1', name: 'CUSTOM' });
      prisma.permission.findMany.mockResolvedValue([{ id: 'p1' }]); // only 1 found

      const result = await service.setPermissions(tenantId, 'r1', {
        permissionIds: ['p1', 'p2-invalid'],
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_INPUT');
    });
  });

  describe('assignRolesToUser', () => {
    it('should assign roles to a user', async () => {
      prisma.tenantUser.findFirst
        .mockResolvedValueOnce({ id: 'u1', tenantId })
        .mockResolvedValueOnce({
          id: 'u1',
          email: 'user@test.com',
          firstName: 'Test',
          lastName: 'User',
          roleAssignments: [],
        });
      prisma.role.findMany.mockResolvedValue([{ id: 'r1' }]);
      prisma.userRole.deleteMany.mockResolvedValue({});
      prisma.userRole.create.mockResolvedValue({});

      const result = await service.assignRolesToUser(tenantId, 'u1', {
        roleIds: ['r1'],
      });

      expect(result.success).toBe(true);
      expect(rolesGuard.invalidateCache).toHaveBeenCalledWith('u1');
    });

    it('should fail if user not found in tenant', async () => {
      prisma.tenantUser.findFirst.mockResolvedValue(null);

      const result = await service.assignRolesToUser(tenantId, 'u1', {
        roleIds: ['r1'],
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });

    it('should fail if some role IDs are invalid', async () => {
      prisma.tenantUser.findFirst.mockResolvedValue({ id: 'u1', tenantId });
      prisma.role.findMany.mockResolvedValue([]); // none found

      const result = await service.assignRolesToUser(tenantId, 'u1', {
        roleIds: ['r-invalid'],
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_INPUT');
    });
  });

  describe('listPermissions', () => {
    it('should return all permissions', async () => {
      const permissions = [
        { id: 'p1', resource: 'users', action: 'read' },
        { id: 'p2', resource: 'users', action: 'create' },
      ];
      prisma.permission.findMany.mockResolvedValue(permissions);

      const result = await service.listPermissions();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(permissions);
    });
  });

  describe('seedPermissions', () => {
    it('should seed permissions that do not exist', async () => {
      prisma.permission.findUnique.mockResolvedValue(null);
      prisma.permission.create.mockResolvedValue({});

      await service.seedPermissions();

      expect(prisma.permission.create).toHaveBeenCalled();
    });

    it('should skip permissions that already exist', async () => {
      prisma.permission.findUnique.mockResolvedValue({ id: 'existing' });

      await service.seedPermissions();

      expect(prisma.permission.create).not.toHaveBeenCalled();
    });
  });

  describe('createDefaultRolesForTenant', () => {
    it('should create default system roles for a new tenant', async () => {
      prisma.role.findUnique.mockResolvedValue(null);
      prisma.role.create.mockResolvedValue({ id: 'new-role-id' });
      prisma.permission.findUnique.mockResolvedValue({ id: 'perm-id' });
      prisma.rolePermission.create.mockResolvedValue({});

      await service.createDefaultRolesForTenant(tenantId);

      // Should create 4 default roles: OWNER, ADMIN, MANAGER, MEMBER
      expect(prisma.role.create).toHaveBeenCalledTimes(4);
    });

    it('should skip roles that already exist', async () => {
      prisma.role.findUnique.mockResolvedValue({ id: 'existing-role' });

      await service.createDefaultRolesForTenant(tenantId);

      expect(prisma.role.create).not.toHaveBeenCalled();
    });
  });
});
