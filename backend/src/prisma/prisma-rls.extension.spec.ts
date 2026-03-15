import { withRLS, withRLSBypass, RLS_PROTECTED_MODELS } from './prisma-rls.extension';

// Mock PrismaClient
function createMockPrisma() {
  const txClient: Record<string, any> = {};
  const executeRawCalls: any[] = [];

  // Create model accessors on the transaction client
  for (const model of RLS_PROTECTED_MODELS) {
    const accessor = model.charAt(0).toLowerCase() + model.slice(1);
    txClient[accessor] = {
      findMany: jest.fn().mockResolvedValue([{ id: 'result-1' }]),
      findUnique: jest.fn().mockResolvedValue({ id: 'result-1' }),
      create: jest.fn().mockResolvedValue({ id: 'new-1' }),
      update: jest.fn().mockResolvedValue({ id: 'updated-1' }),
      delete: jest.fn().mockResolvedValue({ id: 'deleted-1' }),
      count: jest.fn().mockResolvedValue(5),
    };
  }

  txClient.$executeRaw = jest.fn().mockImplementation((...args: any[]) => {
    executeRawCalls.push(args);
    return Promise.resolve(0);
  });

  const prisma: any = {
    $extends: jest.fn().mockImplementation((extension: any) => {
      // Return a proxy that intercepts model access and calls the extension
      const handler: ProxyHandler<any> = {
        get(_target, prop: string) {
          // For model accessors, return a proxy that intercepts operations
          const modelName = prop.charAt(0).toUpperCase() + prop.slice(1);
          if (RLS_PROTECTED_MODELS.includes(modelName as any)) {
            return new Proxy({}, {
              get(_t, operation: string) {
                return (args: any) => {
                  return extension.query.$allOperations({
                    model: modelName,
                    operation,
                    args,
                    query: (a: any) => Promise.resolve({ queried: true, args: a }),
                  });
                };
              },
            });
          }
          // For non-RLS models
          if (['tenant', 'adminUser', 'permission', 'subscriptionPlan'].includes(prop)) {
            return new Proxy({}, {
              get(_t, operation: string) {
                return (args: any) => {
                  return extension.query.$allOperations({
                    model: prop.charAt(0).toUpperCase() + prop.slice(1),
                    operation,
                    args,
                    query: (a: any) => Promise.resolve({ queried: true, args: a }),
                  });
                };
              },
            });
          }
          // For model-less operations (e.g. $queryRaw)
          if (prop.startsWith('$')) {
            return (...fnArgs: any[]) => {
              return extension.query.$allOperations({
                model: undefined,
                operation: prop,
                args: fnArgs,
                query: (a: any) => Promise.resolve({ queried: true, args: a }),
              });
            };
          }
          return undefined;
        },
      };
      return new Proxy({}, handler);
    }),
    $transaction: jest.fn().mockImplementation(async (fn: any) => {
      return fn(txClient);
    }),
  };

  return { prisma, txClient, executeRawCalls };
}

describe('withRLS', () => {
  const TENANT_ID = '550e8400-e29b-41d4-a716-446655440000';

  it('should set app.current_tenant_id for RLS-protected model queries', async () => {
    const { prisma, txClient } = createMockPrisma();

    const tenantPrisma = withRLS(prisma, TENANT_ID);
    await tenantPrisma.tenantUser.findMany({ where: { isActive: true } });

    // Should have opened a transaction
    expect(prisma.$transaction).toHaveBeenCalled();
    // Should have set the tenant ID
    expect(txClient.$executeRaw).toHaveBeenCalled();
    // Should have called findMany on the tx client
    expect(txClient.tenantUser.findMany).toHaveBeenCalledWith({ where: { isActive: true } });
  });

  it('should set tenant context for Role model', async () => {
    const { prisma, txClient } = createMockPrisma();

    const tenantPrisma = withRLS(prisma, TENANT_ID);
    await tenantPrisma.role.findMany({});

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(txClient.$executeRaw).toHaveBeenCalled();
    expect(txClient.role.findMany).toHaveBeenCalledWith({});
  });

  it('should set tenant context for RolePermission model', async () => {
    const { prisma, txClient } = createMockPrisma();

    const tenantPrisma = withRLS(prisma, TENANT_ID);
    await tenantPrisma.rolePermission.findMany({});

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(txClient.rolePermission.findMany).toHaveBeenCalledWith({});
  });

  it('should set tenant context for UserRole model', async () => {
    const { prisma, txClient } = createMockPrisma();

    const tenantPrisma = withRLS(prisma, TENANT_ID);
    await tenantPrisma.userRole.findMany({});

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(txClient.userRole.findMany).toHaveBeenCalledWith({});
  });

  it('should set tenant context for AuditLog model', async () => {
    const { prisma, txClient } = createMockPrisma();

    const tenantPrisma = withRLS(prisma, TENANT_ID);
    await tenantPrisma.auditLog.findMany({});

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(txClient.auditLog.findMany).toHaveBeenCalledWith({});
  });

  it('should set tenant context for TenantSubscription model', async () => {
    const { prisma, txClient } = createMockPrisma();

    const tenantPrisma = withRLS(prisma, TENANT_ID);
    await tenantPrisma.tenantSubscription.findMany({});

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(txClient.tenantSubscription.findMany).toHaveBeenCalledWith({});
  });

  it('should NOT wrap non-RLS models in a transaction', async () => {
    const { prisma } = createMockPrisma();

    const tenantPrisma = withRLS(prisma, TENANT_ID);
    const result = await tenantPrisma.tenant.findMany({});

    // Non-RLS model should bypass transaction and use query() directly
    expect(result).toEqual({ queried: true, args: {} });
    // $transaction should NOT have been called for a non-RLS model
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('should NOT wrap platform models (AdminUser) in a transaction', async () => {
    const { prisma } = createMockPrisma();

    const tenantPrisma = withRLS(prisma, TENANT_ID);
    const result = await tenantPrisma.adminUser.findMany({});

    expect(result).toEqual({ queried: true, args: {} });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('should work with create operations', async () => {
    const { prisma, txClient } = createMockPrisma();

    const tenantPrisma = withRLS(prisma, TENANT_ID);
    const createData = { email: 'test@example.com', firstName: 'Test', lastName: 'User', passwordHash: 'hashed', tenantId: TENANT_ID } as any;
    await tenantPrisma.tenantUser.create({ data: createData });

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(txClient.tenantUser.create).toHaveBeenCalledWith({ data: createData });
  });

  it('should work with update operations', async () => {
    const { prisma, txClient } = createMockPrisma();

    const tenantPrisma = withRLS(prisma, TENANT_ID);
    await tenantPrisma.tenantUser.update({ where: { id: 'user-1' }, data: { firstName: 'Updated' } });

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(txClient.tenantUser.update).toHaveBeenCalled();
  });

  it('should work with delete operations', async () => {
    const { prisma, txClient } = createMockPrisma();

    const tenantPrisma = withRLS(prisma, TENANT_ID);
    await tenantPrisma.tenantUser.delete({ where: { id: 'user-1' } });

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(txClient.tenantUser.delete).toHaveBeenCalledWith({ where: { id: 'user-1' } });
  });

  it('should work with count operations', async () => {
    const { prisma, txClient } = createMockPrisma();

    const tenantPrisma = withRLS(prisma, TENANT_ID);
    await tenantPrisma.tenantUser.count({ where: { isActive: true } });

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(txClient.tenantUser.count).toHaveBeenCalledWith({ where: { isActive: true } });
  });
});

describe('withRLSBypass', () => {
  it('should set app.bypass_rls for RLS-protected model queries', async () => {
    const { prisma, txClient } = createMockPrisma();

    const adminPrisma = withRLSBypass(prisma);
    await adminPrisma.tenantUser.findMany({});

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(txClient.$executeRaw).toHaveBeenCalled();
    expect(txClient.tenantUser.findMany).toHaveBeenCalledWith({});
  });

  it('should NOT wrap non-RLS models in a transaction', async () => {
    const { prisma } = createMockPrisma();

    const adminPrisma = withRLSBypass(prisma);
    const result = await adminPrisma.tenant.findMany({});

    expect(result).toEqual({ queried: true, args: {} });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('should allow querying across all tenants', async () => {
    const { prisma, txClient } = createMockPrisma();

    const adminPrisma = withRLSBypass(prisma);
    await adminPrisma.role.findMany({});

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(txClient.$executeRaw).toHaveBeenCalled();
    expect(txClient.role.findMany).toHaveBeenCalledWith({});
  });

  it('should bypass for AuditLog queries (including platform-wide)', async () => {
    const { prisma, txClient } = createMockPrisma();

    const adminPrisma = withRLSBypass(prisma);
    await adminPrisma.auditLog.findMany({ where: { tenantId: null } });

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(txClient.auditLog.findMany).toHaveBeenCalledWith({ where: { tenantId: null } });
  });
});

describe('RLS_PROTECTED_MODELS', () => {
  it('should include all tenant-scoped models', () => {
    expect(RLS_PROTECTED_MODELS).toContain('TenantUser');
    expect(RLS_PROTECTED_MODELS).toContain('Role');
    expect(RLS_PROTECTED_MODELS).toContain('RolePermission');
    expect(RLS_PROTECTED_MODELS).toContain('UserRole');
    expect(RLS_PROTECTED_MODELS).toContain('AuditLog');
    expect(RLS_PROTECTED_MODELS).toContain('TenantSubscription');
  });

  it('should NOT include platform-wide models', () => {
    expect(RLS_PROTECTED_MODELS).not.toContain('AdminUser');
    expect(RLS_PROTECTED_MODELS).not.toContain('Tenant');
    expect(RLS_PROTECTED_MODELS).not.toContain('ClientUser');
    expect(RLS_PROTECTED_MODELS).not.toContain('Permission');
    expect(RLS_PROTECTED_MODELS).not.toContain('SubscriptionPlan');
    expect(RLS_PROTECTED_MODELS).not.toContain('RefreshToken');
  });
});
