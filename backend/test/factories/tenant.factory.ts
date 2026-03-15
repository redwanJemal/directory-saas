import { PrismaClient } from '@prisma/client';
import { randomId } from './utils';

export interface TenantFactoryInput {
  name?: string;
  slug?: string;
  domain?: string | null;
  status?: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'CANCELLED';
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  settings?: Record<string, unknown> | null;
}

/**
 * Creates a plain tenant data object (no DB interaction).
 * Use for unit tests with mocked dependencies.
 */
export function createTenantFactory(overrides?: TenantFactoryInput) {
  const id = randomId();
  return {
    id: `tenant-${id}`,
    name: `Test Tenant ${id}`,
    slug: `test-${id}`,
    domain: null,
    status: 'ACTIVE' as const,
    logoUrl: null,
    primaryColor: null,
    secondaryColor: null,
    settings: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

/**
 * Creates a tenant in the test database and returns it.
 * Use for E2E / integration tests.
 */
export async function createTenantDbFactory(
  prisma: PrismaClient,
  overrides?: TenantFactoryInput,
) {
  const id = randomId();
  return prisma.tenant.create({
    data: {
      name: `Test Tenant ${id}`,
      slug: `test-${id}`,
      status: 'ACTIVE',
      ...overrides,
    },
  });
}
