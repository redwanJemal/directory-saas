import { AuditService, maskSensitiveData } from './audit.service';
import { PrismaService } from '../../prisma/prisma.service';

function createMockPrisma() {
  return {
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  } as unknown as PrismaService;
}

describe('AuditService', () => {
  let service: AuditService;
  let prisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new AuditService(prisma as any);
  });

  describe('log', () => {
    it('should create an audit log entry for CREATE action', async () => {
      const entry = {
        tenantId: 'tenant-1',
        userId: 'user-1',
        userType: 'tenant',
        action: 'CREATE' as const,
        entity: 'users',
        entityId: 'new-user-1',
        newData: { email: 'test@example.com', name: 'Test User' },
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      };

      const mockResult = { id: 'audit-1', ...entry, createdAt: new Date() };
      (prisma.auditLog.create as jest.Mock).mockResolvedValue(mockResult);

      const result = await service.log(entry);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult);
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: 'tenant-1',
          userId: 'user-1',
          action: 'CREATE',
          entity: 'users',
          entityId: 'new-user-1',
          newData: { email: 'test@example.com', name: 'Test User' },
        }),
      });
    });

    it('should create an audit log entry for UPDATE with oldData and newData', async () => {
      const entry = {
        tenantId: 'tenant-1',
        userId: 'user-1',
        userType: 'tenant',
        action: 'UPDATE' as const,
        entity: 'users',
        entityId: 'user-2',
        oldData: { name: 'Old Name' },
        newData: { name: 'New Name' },
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      };

      (prisma.auditLog.create as jest.Mock).mockResolvedValue({ id: 'audit-2', ...entry });

      const result = await service.log(entry);

      expect(result.success).toBe(true);
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'UPDATE',
          oldData: { name: 'Old Name' },
          newData: { name: 'New Name' },
        }),
      });
    });

    it('should create an audit log entry for DELETE with oldData', async () => {
      const entry = {
        tenantId: 'tenant-1',
        userId: 'user-1',
        userType: 'tenant',
        action: 'DELETE' as const,
        entity: 'users',
        entityId: 'user-2',
        oldData: { name: 'Deleted User', email: 'deleted@test.com' },
        ipAddress: '10.0.0.1',
        userAgent: 'curl/7.0',
      };

      (prisma.auditLog.create as jest.Mock).mockResolvedValue({ id: 'audit-3', ...entry });

      const result = await service.log(entry);

      expect(result.success).toBe(true);
      const createCall = (prisma.auditLog.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.action).toBe('DELETE');
      expect(createCall.data.oldData).toEqual({ name: 'Deleted User', email: 'deleted@test.com' });
      // newData uses Prisma.JsonNull when no data provided
      expect(createCall.data.newData).toBeDefined();
    });

    it('should include userId, tenantId, and IP in log entries', async () => {
      const entry = {
        tenantId: 'tenant-abc',
        userId: 'user-xyz',
        userType: 'admin',
        action: 'CREATE' as const,
        entity: 'tenants',
        ipAddress: '192.168.1.1',
        userAgent: 'TestAgent/1.0',
      };

      (prisma.auditLog.create as jest.Mock).mockResolvedValue({ id: 'audit-4', ...entry });

      await service.log(entry);

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: 'tenant-abc',
          userId: 'user-xyz',
          ipAddress: '192.168.1.1',
          userAgent: 'TestAgent/1.0',
        }),
      });
    });

    it('should mask sensitive fields in newData', async () => {
      const entry = {
        action: 'CREATE' as const,
        entity: 'users',
        newData: {
          email: 'user@test.com',
          passwordHash: 'secret-hash-123',
          twoFactorSecret: 'JBSWY3DPEHPK3PXP',
          name: 'Visible Name',
        },
      };

      (prisma.auditLog.create as jest.Mock).mockResolvedValue({ id: 'audit-5' });

      await service.log(entry);

      const createCall = (prisma.auditLog.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.newData.passwordHash).toBe('[REDACTED]');
      expect(createCall.data.newData.twoFactorSecret).toBe('[REDACTED]');
      expect(createCall.data.newData.email).toBe('user@test.com');
      expect(createCall.data.newData.name).toBe('Visible Name');
    });

    it('should mask sensitive fields in oldData', async () => {
      const entry = {
        action: 'UPDATE' as const,
        entity: 'users',
        oldData: {
          tokenHash: 'old-token-hash',
          email: 'old@test.com',
        },
        newData: {
          tokenHash: 'new-token-hash',
          email: 'new@test.com',
        },
      };

      (prisma.auditLog.create as jest.Mock).mockResolvedValue({ id: 'audit-6' });

      await service.log(entry);

      const createCall = (prisma.auditLog.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.oldData.tokenHash).toBe('[REDACTED]');
      expect(createCall.data.oldData.email).toBe('old@test.com');
      expect(createCall.data.newData.tokenHash).toBe('[REDACTED]');
      expect(createCall.data.newData.email).toBe('new@test.com');
    });
  });

  describe('findAll', () => {
    it('should query audit logs scoped to tenant with default sort', async () => {
      const mockLogs = [
        { id: 'log-1', action: 'CREATE', entity: 'users', createdAt: new Date() },
        { id: 'log-2', action: 'UPDATE', entity: 'users', createdAt: new Date() },
      ];

      (prisma.auditLog.findMany as jest.Mock).mockResolvedValue(mockLogs);
      (prisma.auditLog.count as jest.Mock).mockResolvedValue(2);

      const query = {
        filters: [],
        sort: [],
        page: 1,
        pageSize: 20,
        include: [],
      };

      const result = await service.findAll('tenant-1', query);

      expect(result.success).toBe(true);
      expect(result.data?.items).toEqual(mockLogs);
      expect(result.data?.total).toBe(2);

      const findCall = (prisma.auditLog.findMany as jest.Mock).mock.calls[0][0];
      expect(findCall.where.tenantId).toBe('tenant-1');
      expect(findCall.orderBy).toEqual([{ createdAt: 'desc' }]);
    });

    it('should support filtering by entity and action', async () => {
      (prisma.auditLog.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.auditLog.count as jest.Mock).mockResolvedValue(0);

      const query = {
        filters: [
          { field: 'entity', operator: 'eq' as const, value: 'users' },
          { field: 'action', operator: 'eq' as const, value: 'CREATE' },
        ],
        sort: [],
        page: 1,
        pageSize: 20,
        include: [],
      };

      await service.findAll('tenant-1', query);

      const findCall = (prisma.auditLog.findMany as jest.Mock).mock.calls[0][0];
      expect(findCall.where.entity).toBe('users');
      expect(findCall.where.action).toBe('CREATE');
      expect(findCall.where.tenantId).toBe('tenant-1');
    });
  });

  describe('findAllAdmin', () => {
    it('should query audit logs without tenant scoping', async () => {
      (prisma.auditLog.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.auditLog.count as jest.Mock).mockResolvedValue(0);

      const query = {
        filters: [],
        sort: [],
        page: 1,
        pageSize: 20,
        include: [],
      };

      const result = await service.findAllAdmin(query);

      expect(result.success).toBe(true);
      const findCall = (prisma.auditLog.findMany as jest.Mock).mock.calls[0][0];
      expect(findCall.where.tenantId).toBeUndefined();
    });
  });
});

describe('maskSensitiveData', () => {
  it('should mask passwordHash', () => {
    const data = { email: 'a@b.com', passwordHash: 'hash123' };
    const result = maskSensitiveData(data) as Record<string, unknown>;
    expect(result.passwordHash).toBe('[REDACTED]');
    expect(result.email).toBe('a@b.com');
  });

  it('should mask twoFactorSecret', () => {
    const data = { twoFactorSecret: 'secret', name: 'Test' };
    const result = maskSensitiveData(data) as Record<string, unknown>;
    expect(result.twoFactorSecret).toBe('[REDACTED]');
    expect(result.name).toBe('Test');
  });

  it('should mask tokenHash', () => {
    const data = { tokenHash: 'abc', id: '1' };
    const result = maskSensitiveData(data) as Record<string, unknown>;
    expect(result.tokenHash).toBe('[REDACTED]');
    expect(result.id).toBe('1');
  });

  it('should mask snake_case sensitive fields', () => {
    const data = { password_hash: 'hash', token_hash: 'token', two_factor_secret: 'secret' };
    const result = maskSensitiveData(data) as Record<string, unknown>;
    expect(result.password_hash).toBe('[REDACTED]');
    expect(result.token_hash).toBe('[REDACTED]');
    expect(result.two_factor_secret).toBe('[REDACTED]');
  });

  it('should mask nested sensitive fields', () => {
    const data = { user: { email: 'a@b.com', passwordHash: 'secret' } };
    const result = maskSensitiveData(data) as any;
    expect(result.user.passwordHash).toBe('[REDACTED]');
    expect(result.user.email).toBe('a@b.com');
  });

  it('should handle null and undefined data', () => {
    expect(maskSensitiveData(null)).toBeNull();
    expect(maskSensitiveData(undefined)).toBeUndefined();
  });

  it('should handle arrays', () => {
    const data = [{ passwordHash: 'hash1' }, { passwordHash: 'hash2' }];
    const result = maskSensitiveData(data) as any[];
    expect(result[0].passwordHash).toBe('[REDACTED]');
    expect(result[1].passwordHash).toBe('[REDACTED]');
  });

  it('should not modify non-sensitive fields', () => {
    const data = { name: 'John', email: 'john@example.com', status: 'active' };
    const result = maskSensitiveData(data);
    expect(result).toEqual(data);
  });

  it('should not modify primitive values', () => {
    expect(maskSensitiveData('string')).toBe('string');
    expect(maskSensitiveData(42)).toBe(42);
    expect(maskSensitiveData(true)).toBe(true);
  });
});
