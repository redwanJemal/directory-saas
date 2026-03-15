import { Test, TestingModule } from '@nestjs/testing';
import { RolesController, UserRolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { ServiceResult } from '../../common/types';
import { AppException } from '../../common/exceptions/app.exception';
import { Reflector } from '@nestjs/core';

const mockRolesGuard = { canActivate: jest.fn().mockReturnValue(true) };

describe('RolesController', () => {
  let controller: RolesController;
  let service: RolesService;

  const tenantId = 'tenant-uuid-1';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolesController],
      providers: [
        {
          provide: RolesService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            setPermissions: jest.fn(),
            listPermissions: jest.fn(),
          },
        },
        { provide: PrismaService, useValue: {} },
        Reflector,
      ],
    })
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<RolesController>(RolesController);
    service = module.get<RolesService>(RolesService);
  });

  describe('create', () => {
    it('should create a role and return data', async () => {
      const role = { id: 'r1', name: 'CUSTOM', displayName: 'Custom' };
      jest.spyOn(service, 'create').mockResolvedValue(ServiceResult.ok(role));

      const result = await controller.create(tenantId, { name: 'CUSTOM', displayName: 'Custom' });
      expect(result).toEqual(role);
    });

    it('should throw on failure', async () => {
      jest.spyOn(service, 'create').mockResolvedValue(
        ServiceResult.fail('ALREADY_EXISTS', 'Role exists'),
      );

      await expect(
        controller.create(tenantId, { name: 'EXISTING', displayName: 'Existing' }),
      ).rejects.toThrow(AppException);
    });
  });

  describe('findAll', () => {
    it('should return all roles', async () => {
      const roles = [{ id: 'r1', name: 'OWNER' }];
      jest.spyOn(service, 'findAll').mockResolvedValue(ServiceResult.ok(roles));

      const result = await controller.findAll(tenantId);
      expect(result).toEqual(roles);
    });
  });

  describe('findOne', () => {
    it('should return a role', async () => {
      const role = { id: 'r1', name: 'OWNER', permissions: [] };
      jest.spyOn(service, 'findOne').mockResolvedValue(ServiceResult.ok(role));

      const result = await controller.findOne(tenantId, 'r1');
      expect(result).toEqual(role);
    });

    it('should throw when not found', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(
        ServiceResult.fail('NOT_FOUND', 'Role not found'),
      );

      await expect(controller.findOne(tenantId, 'bad-id')).rejects.toThrow(AppException);
    });
  });

  describe('update', () => {
    it('should update a role', async () => {
      const updated = { id: 'r1', displayName: 'Updated' };
      jest.spyOn(service, 'update').mockResolvedValue(ServiceResult.ok(updated));

      const result = await controller.update(tenantId, 'r1', { displayName: 'Updated' });
      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('should delete a role', async () => {
      jest.spyOn(service, 'delete').mockResolvedValue(ServiceResult.ok({ deleted: true }));

      const result = await controller.remove(tenantId, 'r1');
      expect(result).toEqual({ deleted: true });
    });

    it('should throw when trying to delete system role', async () => {
      jest.spyOn(service, 'delete').mockResolvedValue(
        ServiceResult.fail('FORBIDDEN', 'Cannot delete system roles'),
      );

      await expect(controller.remove(tenantId, 'r1')).rejects.toThrow(AppException);
    });
  });

  describe('setPermissions', () => {
    it('should set permissions for a role', async () => {
      const role = { id: 'r1', permissions: [] };
      jest.spyOn(service, 'setPermissions').mockResolvedValue(ServiceResult.ok(role));

      const result = await controller.setPermissions(tenantId, 'r1', { permissionIds: ['p1'] });
      expect(result).toEqual(role);
    });
  });

  describe('listPermissions', () => {
    it('should return all permissions', async () => {
      const perms = [{ id: 'p1', resource: 'users', action: 'read' }];
      jest.spyOn(service, 'listPermissions').mockResolvedValue(ServiceResult.ok(perms));

      const result = await controller.listPermissions();
      expect(result).toEqual(perms);
    });
  });
});

describe('UserRolesController', () => {
  let controller: UserRolesController;
  let service: RolesService;

  const tenantId = 'tenant-uuid-1';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserRolesController],
      providers: [
        {
          provide: RolesService,
          useValue: {
            assignRolesToUser: jest.fn(),
          },
        },
        { provide: PrismaService, useValue: {} },
        Reflector,
      ],
    })
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<UserRolesController>(UserRolesController);
    service = module.get<RolesService>(RolesService);
  });

  describe('assignRoles', () => {
    it('should assign roles to a user', async () => {
      const userData = { id: 'u1', roleAssignments: [] };
      jest.spyOn(service, 'assignRolesToUser').mockResolvedValue(ServiceResult.ok(userData));

      const result = await controller.assignRoles(tenantId, 'u1', { roleIds: ['r1'] });
      expect(result).toEqual(userData);
    });

    it('should throw when user not found', async () => {
      jest.spyOn(service, 'assignRolesToUser').mockResolvedValue(
        ServiceResult.fail('NOT_FOUND', 'User not found'),
      );

      await expect(
        controller.assignRoles(tenantId, 'bad-id', { roleIds: ['r1'] }),
      ).rejects.toThrow(AppException);
    });
  });
});
