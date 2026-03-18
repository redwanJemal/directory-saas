import { TenantResolutionMiddleware } from './tenant-resolution.middleware';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantCacheService } from '../services/tenant-cache.service';
import { AppException } from '../exceptions/app.exception';
import { RequestContext } from '../services/request-context';
import { Request, Response } from 'express';

function createMockRequest(overrides: Partial<Request> = {}): Request {
  return {
    headers: {},
    baseUrl: '/api/v1/tenants',
    path: '/api/v1/tenants',
    body: {},
    ...overrides,
  } as unknown as Request;
}

function createMockResponse(): Response {
  return {} as Response;
}

describe('TenantResolutionMiddleware', () => {
  let middleware: TenantResolutionMiddleware;
  let prisma: { tenant: { findUnique: jest.Mock } };
  let tenantCache: TenantCacheService;
  let next: jest.Mock;

  const activeTenant = {
    id: '11111111-1111-1111-1111-111111111111',
    slug: 'acme',
    status: 'ACTIVE',
    deletedAt: null,
  };

  const trialTenant = {
    id: '22222222-2222-2222-2222-222222222222',
    slug: 'trial-co',
    status: 'TRIAL',
    deletedAt: null,
  };

  const suspendedTenant = {
    id: '33333333-3333-3333-3333-333333333333',
    slug: 'suspended-co',
    status: 'SUSPENDED',
    deletedAt: null,
  };

  const cancelledTenant = {
    id: '44444444-4444-4444-4444-444444444444',
    slug: 'cancelled-co',
    status: 'CANCELLED',
    deletedAt: null,
  };

  const deletedTenant = {
    id: '55555555-5555-5555-5555-555555555555',
    slug: 'deleted-co',
    status: 'ACTIVE',
    deletedAt: new Date('2026-01-01'),
  };

  beforeEach(() => {
    prisma = {
      tenant: {
        findUnique: jest.fn(),
      },
    };
    tenantCache = new TenantCacheService();
    middleware = new TenantResolutionMiddleware(
      prisma as unknown as PrismaService,
      tenantCache,
    );
    next = jest.fn();
  });

  function runInContext(fn: () => Promise<void>): Promise<void> {
    return new Promise((resolve, reject) => {
      RequestContext.run(() => {
        fn().then(resolve).catch(reject);
      });
    });
  }

  describe('skip paths', () => {
    it('should skip /api/v1/auth/login', async () => {
      const req = createMockRequest({ baseUrl: '/api/v1/auth/login' });
      await middleware.use(req, createMockResponse(), next);
      expect(next).toHaveBeenCalled();
      expect(prisma.tenant.findUnique).not.toHaveBeenCalled();
    });

    it('should skip /api/v1/auth/register', async () => {
      const req = createMockRequest({ baseUrl: '/api/v1/auth/register' });
      await middleware.use(req, createMockResponse(), next);
      expect(next).toHaveBeenCalled();
      expect(prisma.tenant.findUnique).not.toHaveBeenCalled();
    });

    it('should skip /api/v1/admin routes', async () => {
      const req = createMockRequest({ baseUrl: '/api/v1/admin/tenants' });
      await middleware.use(req, createMockResponse(), next);
      expect(next).toHaveBeenCalled();
      expect(prisma.tenant.findUnique).not.toHaveBeenCalled();
    });

    it('should skip /api/v1/health', async () => {
      const req = createMockRequest({ baseUrl: '/api/v1/health' });
      await middleware.use(req, createMockResponse(), next);
      expect(next).toHaveBeenCalled();
    });

    it('should skip /api/docs', async () => {
      const req = createMockRequest({ baseUrl: '/api/docs' });
      await middleware.use(req, createMockResponse(), next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('subdomain resolution', () => {
    it('should resolve tenant from subdomain', async () => {
      prisma.tenant.findUnique.mockResolvedValue(activeTenant);
      const req = createMockRequest({
        headers: { host: 'acme.directory-saas.com' } as Record<string, string>,
      });

      await runInContext(async () => {
        await middleware.use(req, createMockResponse(), next);
        expect(next).toHaveBeenCalled();
        expect(RequestContext.tenantId).toBe(activeTenant.id);
        expect(RequestContext.get('tenantSlug')).toBe('acme');
      });
    });

    it('should ignore www subdomain', async () => {
      const req = createMockRequest({
        headers: { host: 'www.directory-saas.com' } as Record<string, string>,
      });

      await runInContext(async () => {
        await middleware.use(req, createMockResponse(), next);
        expect(next).toHaveBeenCalled();
        expect(prisma.tenant.findUnique).not.toHaveBeenCalled();
      });
    });

    it('should ignore localhost subdomain', async () => {
      const req = createMockRequest({
        headers: { host: 'localhost:3000' } as Record<string, string>,
      });

      await runInContext(async () => {
        await middleware.use(req, createMockResponse(), next);
        expect(next).toHaveBeenCalled();
        expect(prisma.tenant.findUnique).not.toHaveBeenCalled();
      });
    });

    it('should ignore country-code subdomains (ae, sa, kw, qa, bh, om)', async () => {
      for (const code of ['ae', 'sa', 'kw', 'qa', 'bh', 'om']) {
        const req = createMockRequest({
          headers: { host: `${code}.habeshahub.com` } as Record<string, string>,
        });

        await runInContext(async () => {
          await middleware.use(req, createMockResponse(), jest.fn());
          expect(prisma.tenant.findUnique).not.toHaveBeenCalled();
        });
      }
    });
  });

  describe('X-Tenant-ID header resolution', () => {
    it('should resolve tenant from X-Tenant-ID header', async () => {
      prisma.tenant.findUnique.mockResolvedValue(activeTenant);
      const req = createMockRequest({
        headers: {
          'x-tenant-id': activeTenant.id,
        } as Record<string, string>,
      });

      await runInContext(async () => {
        await middleware.use(req, createMockResponse(), next);
        expect(next).toHaveBeenCalled();
        expect(RequestContext.tenantId).toBe(activeTenant.id);
      });
    });

    it('should ignore invalid UUID in X-Tenant-ID', async () => {
      const req = createMockRequest({
        headers: { 'x-tenant-id': 'not-a-uuid' } as Record<string, string>,
      });

      await runInContext(async () => {
        await middleware.use(req, createMockResponse(), next);
        expect(next).toHaveBeenCalled();
        expect(prisma.tenant.findUnique).not.toHaveBeenCalled();
      });
    });
  });

  describe('X-Tenant-Slug header resolution', () => {
    it('should resolve tenant from X-Tenant-Slug header', async () => {
      prisma.tenant.findUnique.mockResolvedValue(activeTenant);
      const req = createMockRequest({
        headers: { 'x-tenant-slug': 'acme' } as Record<string, string>,
      });

      await runInContext(async () => {
        await middleware.use(req, createMockResponse(), next);
        expect(next).toHaveBeenCalled();
        expect(RequestContext.tenantId).toBe(activeTenant.id);
        expect(RequestContext.get('tenantSlug')).toBe('acme');
      });
    });
  });

  describe('JWT tenantId resolution', () => {
    it('should resolve tenant from JWT tenantId on request', async () => {
      prisma.tenant.findUnique.mockResolvedValue(activeTenant);
      const req = createMockRequest();
      (req as unknown as Record<string, unknown>)['tenantId'] = activeTenant.id;

      await runInContext(async () => {
        await middleware.use(req, createMockResponse(), next);
        expect(next).toHaveBeenCalled();
        expect(RequestContext.tenantId).toBe(activeTenant.id);
      });
    });
  });

  describe('priority order', () => {
    it('should prefer subdomain over headers', async () => {
      prisma.tenant.findUnique.mockResolvedValue(activeTenant);
      const req = createMockRequest({
        headers: {
          host: 'acme.directory-saas.com',
          'x-tenant-id': trialTenant.id,
        } as Record<string, string>,
      });

      await runInContext(async () => {
        await middleware.use(req, createMockResponse(), next);
        expect(RequestContext.tenantId).toBe(activeTenant.id);
        // findUnique called once for subdomain slug lookup
        expect(prisma.tenant.findUnique).toHaveBeenCalledTimes(1);
        expect(prisma.tenant.findUnique).toHaveBeenCalledWith({
          where: { slug: 'acme' },
          select: { id: true, slug: true, status: true, deletedAt: true },
        });
      });
    });
  });

  describe('tenant not found', () => {
    it('should call next without tenant context when tenant not found', async () => {
      prisma.tenant.findUnique.mockResolvedValue(null);
      const req = createMockRequest({
        headers: {
          'x-tenant-id': '99999999-9999-9999-9999-999999999999',
        } as Record<string, string>,
      });

      await runInContext(async () => {
        await middleware.use(req, createMockResponse(), next);
        expect(next).toHaveBeenCalled();
        expect(RequestContext.tenantId).toBeUndefined();
      });
    });
  });

  describe('tenant status validation', () => {
    it('should allow ACTIVE tenants', async () => {
      prisma.tenant.findUnique.mockResolvedValue(activeTenant);
      const req = createMockRequest({
        headers: { 'x-tenant-id': activeTenant.id } as Record<string, string>,
      });

      await runInContext(async () => {
        await middleware.use(req, createMockResponse(), next);
        expect(next).toHaveBeenCalled();
      });
    });

    it('should allow TRIAL tenants', async () => {
      prisma.tenant.findUnique.mockResolvedValue(trialTenant);
      const req = createMockRequest({
        headers: { 'x-tenant-id': trialTenant.id } as Record<string, string>,
      });

      await runInContext(async () => {
        await middleware.use(req, createMockResponse(), next);
        expect(next).toHaveBeenCalled();
      });
    });

    it('should reject SUSPENDED tenants with TENANT_SUSPENDED', async () => {
      prisma.tenant.findUnique.mockResolvedValue(suspendedTenant);
      const req = createMockRequest({
        headers: {
          'x-tenant-id': suspendedTenant.id,
        } as Record<string, string>,
      });

      await runInContext(async () => {
        await expect(
          middleware.use(req, createMockResponse(), next),
        ).rejects.toThrow(AppException);
        await expect(
          middleware.use(req, createMockResponse(), next),
        ).rejects.toMatchObject({
          errorCode: 'TENANT_SUSPENDED',
        });
        expect(next).not.toHaveBeenCalled();
      });
    });

    it('should reject CANCELLED tenants with TENANT_SUSPENDED', async () => {
      prisma.tenant.findUnique.mockResolvedValue(cancelledTenant);
      const req = createMockRequest({
        headers: {
          'x-tenant-id': cancelledTenant.id,
        } as Record<string, string>,
      });

      await runInContext(async () => {
        await expect(
          middleware.use(req, createMockResponse(), next),
        ).rejects.toThrow(AppException);
        await expect(
          middleware.use(req, createMockResponse(), next),
        ).rejects.toMatchObject({
          errorCode: 'TENANT_SUSPENDED',
        });
      });
    });

    it('should reject soft-deleted tenants with TENANT_NOT_FOUND', async () => {
      prisma.tenant.findUnique.mockResolvedValue(deletedTenant);
      const req = createMockRequest({
        headers: {
          'x-tenant-id': deletedTenant.id,
        } as Record<string, string>,
      });

      await runInContext(async () => {
        await expect(
          middleware.use(req, createMockResponse(), next),
        ).rejects.toThrow(AppException);
        await expect(
          middleware.use(req, createMockResponse(), next),
        ).rejects.toMatchObject({
          errorCode: 'TENANT_NOT_FOUND',
        });
      });
    });
  });

  describe('caching', () => {
    it('should cache tenant after first lookup', async () => {
      prisma.tenant.findUnique.mockResolvedValue(activeTenant);
      const req = createMockRequest({
        headers: { 'x-tenant-slug': 'acme' } as Record<string, string>,
      });

      await runInContext(async () => {
        await middleware.use(req, createMockResponse(), next);
      });

      // Second request should use cache
      const next2 = jest.fn();
      await runInContext(async () => {
        await middleware.use(req, createMockResponse(), next2);
        expect(next2).toHaveBeenCalled();
        expect(RequestContext.tenantId).toBe(activeTenant.id);
      });

      // DB only called once
      expect(prisma.tenant.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should cache tenant by both slug and id', async () => {
      prisma.tenant.findUnique.mockResolvedValue(activeTenant);

      // First: resolve by slug
      const req1 = createMockRequest({
        headers: { 'x-tenant-slug': 'acme' } as Record<string, string>,
      });
      await runInContext(async () => {
        await middleware.use(req1, createMockResponse(), jest.fn());
      });

      // Second: resolve by id — should hit cache
      const req2 = createMockRequest({
        headers: {
          'x-tenant-id': activeTenant.id,
        } as Record<string, string>,
      });
      await runInContext(async () => {
        await middleware.use(req2, createMockResponse(), jest.fn());
        expect(RequestContext.tenantId).toBe(activeTenant.id);
      });

      expect(prisma.tenant.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should bypass cache after invalidation', async () => {
      prisma.tenant.findUnique.mockResolvedValue(activeTenant);

      const req = createMockRequest({
        headers: { 'x-tenant-slug': 'acme' } as Record<string, string>,
      });

      await runInContext(async () => {
        await middleware.use(req, createMockResponse(), jest.fn());
      });

      // Invalidate
      await tenantCache.invalidate(`tenant:slug:acme`);
      await tenantCache.invalidate(`tenant:id:${activeTenant.id}`);

      // Should hit DB again
      await runInContext(async () => {
        await middleware.use(req, createMockResponse(), jest.fn());
      });

      expect(prisma.tenant.findUnique).toHaveBeenCalledTimes(2);
    });
  });

  describe('no tenant resolution sources', () => {
    it('should call next when no tenant info provided', async () => {
      const req = createMockRequest();

      await runInContext(async () => {
        await middleware.use(req, createMockResponse(), next);
        expect(next).toHaveBeenCalled();
        expect(RequestContext.tenantId).toBeUndefined();
      });
    });
  });

  describe('path fallback', () => {
    it('should use req.path when baseUrl is empty', async () => {
      const req = createMockRequest({ baseUrl: '', path: '/api/v1/auth/login' });
      await middleware.use(req, createMockResponse(), next);
      expect(next).toHaveBeenCalled();
      expect(prisma.tenant.findUnique).not.toHaveBeenCalled();
    });
  });
});
