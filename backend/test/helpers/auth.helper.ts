import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createAdminUserDbFactory } from '../factories/admin-user.factory';
import { createTenantDbFactory } from '../factories/tenant.factory';
import { createTenantUserDbFactory } from '../factories/tenant-user.factory';
import { createClientUserDbFactory } from '../factories/client-user.factory';

const DEFAULT_PASSWORD = 'TestPassword123!';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Creates an admin user in the DB and logs in, returning JWT tokens.
 */
export async function getAdminToken(
  app: INestApplication,
  prisma: PrismaClient,
  overrides?: { email?: string; password?: string },
): Promise<AuthTokens> {
  const email = overrides?.email || `admin-e2e-${Date.now()}@test.com`;
  const password = overrides?.password || DEFAULT_PASSWORD;

  await createAdminUserDbFactory(prisma, { email, password });

  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/admin/login')
    .send({ email, password })
    .expect(200);

  return {
    accessToken: res.body.data.accessToken,
    refreshToken: res.body.data.refreshToken,
  };
}

/**
 * Creates a tenant, a tenant user, and logs in, returning JWT tokens.
 */
export async function getTenantToken(
  app: INestApplication,
  prisma: PrismaClient,
  overrides?: {
    tenantSlug?: string;
    email?: string;
    password?: string;
    role?: 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER';
  },
): Promise<AuthTokens & { tenantId: string; tenantSlug: string }> {
  const password = overrides?.password || DEFAULT_PASSWORD;

  const tenant = await createTenantDbFactory(prisma, {
    slug: overrides?.tenantSlug,
  });

  const email =
    overrides?.email || `tenant-e2e-${Date.now()}@test.com`;

  await createTenantUserDbFactory(prisma, tenant.id, {
    email,
    password,
    role: overrides?.role || 'OWNER',
  });

  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/tenant/login')
    .send({ email, password, tenantSlug: tenant.slug })
    .expect(200);

  return {
    accessToken: res.body.data.accessToken,
    refreshToken: res.body.data.refreshToken,
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
  };
}

/**
 * Creates a client user and logs in, returning JWT tokens.
 */
export async function getClientToken(
  app: INestApplication,
  prisma: PrismaClient,
  overrides?: { email?: string; password?: string },
): Promise<AuthTokens> {
  const email = overrides?.email || `client-e2e-${Date.now()}@test.com`;
  const password = overrides?.password || DEFAULT_PASSWORD;

  await createClientUserDbFactory(prisma, { email, password });

  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/client/login')
    .send({ email, password })
    .expect(200);

  return {
    accessToken: res.body.data.accessToken,
    refreshToken: res.body.data.refreshToken,
  };
}
