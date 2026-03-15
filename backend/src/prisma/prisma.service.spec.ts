import { PrismaService } from './prisma.service';
import { RequestContext } from '../common/services/request-context';

// Mock the RLS extension module
jest.mock('./prisma-rls.extension', () => ({
  withRLS: jest.fn().mockReturnValue({ _type: 'rls-client' }),
  withRLSBypass: jest.fn().mockReturnValue({ _type: 'bypass-client' }),
  RLS_PROTECTED_MODELS: ['TenantUser', 'Role', 'RolePermission', 'UserRole', 'AuditLog', 'TenantSubscription'],
}));

// Mock PrismaClient
jest.mock('@prisma/client', () => ({
  PrismaClient: class MockPrismaClient {
    constructor(_opts?: any) {}
    $connect = jest.fn();
    $disconnect = jest.fn();
  },
}));

import { withRLS, withRLSBypass } from './prisma-rls.extension';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(() => {
    service = new PrismaService();
    jest.clearAllMocks();
  });

  describe('lifecycle', () => {
    it('should connect on module init', async () => {
      await service.onModuleInit();
      expect(service.$connect).toHaveBeenCalled();
    });

    it('should disconnect on module destroy', async () => {
      await service.onModuleDestroy();
      expect(service.$disconnect).toHaveBeenCalled();
    });
  });

  describe('rls', () => {
    it('should return RLS-scoped client when tenantId is in RequestContext', () => {
      RequestContext.run(() => {
        RequestContext.set('tenantId', 'tenant-123');
        const client = service.rls;
        expect(withRLS).toHaveBeenCalledWith(service, 'tenant-123');
        expect(client).toEqual({ _type: 'rls-client' });
      });
    });

    it('should return base client when no tenantId in RequestContext', () => {
      RequestContext.run(() => {
        const client = service.rls;
        expect(withRLS).not.toHaveBeenCalled();
        expect(client).toBe(service);
      });
    });

    it('should return base client when outside RequestContext', () => {
      const client = service.rls;
      expect(withRLS).not.toHaveBeenCalled();
      expect(client).toBe(service);
    });
  });

  describe('rlsBypass', () => {
    it('should return RLS-bypass client', () => {
      const client = service.rlsBypass;
      expect(withRLSBypass).toHaveBeenCalledWith(service);
      expect(client).toEqual({ _type: 'bypass-client' });
    });
  });

  describe('forTenant', () => {
    it('should return RLS-scoped client for specific tenant', () => {
      const client = service.forTenant('specific-tenant-id');
      expect(withRLS).toHaveBeenCalledWith(service, 'specific-tenant-id');
      expect(client).toEqual({ _type: 'rls-client' });
    });
  });
});
