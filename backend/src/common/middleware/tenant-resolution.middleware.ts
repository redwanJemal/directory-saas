import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantCacheService } from '../services/tenant-cache.service';
import { RequestContext } from '../services/request-context';
import { AppException } from '../exceptions/app.exception';

interface TenantRecord {
  id: string;
  slug: string;
  status: string;
  deletedAt: Date | null;
}

const SKIP_PATHS = [
  '/api/v1/auth/register',
  '/api/v1/auth/login',
  '/api/v1/health',
  '/api/docs',
];

const SKIP_PREFIXES = ['/api/v1/admin'];

function shouldSkip(path: string): boolean {
  if (SKIP_PATHS.includes(path)) return true;
  return SKIP_PREFIXES.some((prefix) => path.startsWith(prefix));
}

/** Country-code subdomains (ae, sa, kw, qa, bh, om) are not tenant subdomains */
const COUNTRY_SUBDOMAINS = new Set(['ae', 'sa', 'kw', 'qa', 'bh', 'om']);

function extractSubdomain(host: string | undefined): string | null {
  if (!host) return null;
  // Remove port
  const hostname = host.split(':')[0];
  const parts = hostname.split('.');
  // Need at least 3 parts: subdomain.domain.tld
  if (parts.length < 3) return null;
  const subdomain = parts[0];
  // Ignore common non-tenant subdomains and country subdomains
  if (['www', 'api', 'admin', 'app', 'localhost'].includes(subdomain)) return null;
  if (COUNTRY_SUBDOMAINS.has(subdomain.toLowerCase())) return null;
  return subdomain;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class TenantResolutionMiddleware implements NestMiddleware {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantCache: TenantCacheService,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    const path = req.baseUrl || req.path;

    if (shouldSkip(path)) {
      next();
      return;
    }

    const tenant = await this.resolveTenant(req);

    if (!tenant) {
      // No tenant resolved — allow request to proceed without tenant context.
      // Guards downstream (e.g. @CurrentTenant) can enforce tenant requirement.
      next();
      return;
    }

    this.validateTenantStatus(tenant);

    RequestContext.set('tenantId', tenant.id);
    RequestContext.set('tenantSlug', tenant.slug);

    next();
  }

  private async resolveTenant(
    req: Request,
  ): Promise<TenantRecord | null> {
    // 1. Subdomain
    const subdomain = extractSubdomain(req.headers.host);
    if (subdomain) {
      const tenant = await this.findBySlug(subdomain);
      if (tenant) return tenant;
    }

    // 2. X-Tenant-ID header
    const tenantIdHeader = req.headers['x-tenant-id'] as string | undefined;
    if (tenantIdHeader && UUID_REGEX.test(tenantIdHeader)) {
      const tenant = await this.findById(tenantIdHeader);
      if (tenant) return tenant;
    }

    // 3. X-Tenant-Slug header
    const tenantSlugHeader = req.headers['x-tenant-slug'] as string | undefined;
    if (tenantSlugHeader) {
      const tenant = await this.findBySlug(tenantSlugHeader);
      if (tenant) return tenant;
    }

    // 4. JWT claim (set by auth middleware/guard upstream)
    const jwtTenantId = (req as unknown as Record<string, unknown>)[
      'tenantId'
    ] as string | undefined;
    if (jwtTenantId && UUID_REGEX.test(jwtTenantId)) {
      const tenant = await this.findById(jwtTenantId);
      if (tenant) return tenant;
    }

    return null;
  }

  private async findBySlug(slug: string): Promise<TenantRecord | null> {
    const cacheKey = `tenant:slug:${slug}`;
    const cached = await this.tenantCache.get<TenantRecord>(cacheKey);
    if (cached) return cached;

    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, slug: true, status: true, deletedAt: true },
    });

    if (tenant) {
      await this.tenantCache.set(cacheKey, tenant);
      await this.tenantCache.set(`tenant:id:${tenant.id}`, tenant);
    }

    return tenant;
  }

  private async findById(id: string): Promise<TenantRecord | null> {
    const cacheKey = `tenant:id:${id}`;
    const cached = await this.tenantCache.get<TenantRecord>(cacheKey);
    if (cached) return cached;

    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      select: { id: true, slug: true, status: true, deletedAt: true },
    });

    if (tenant) {
      await this.tenantCache.set(cacheKey, tenant);
      await this.tenantCache.set(`tenant:slug:${tenant.slug}`, tenant);
    }

    return tenant;
  }

  private validateTenantStatus(tenant: TenantRecord): void {
    if (tenant.deletedAt) {
      throw new AppException(
        'TENANT_NOT_FOUND',
        'Tenant not found',
      );
    }

    if (tenant.status === 'SUSPENDED' || tenant.status === 'CANCELLED') {
      throw new AppException(
        'TENANT_SUSPENDED',
        `Tenant is ${tenant.status.toLowerCase()}`,
      );
    }
  }
}
