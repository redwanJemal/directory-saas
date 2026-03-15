import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomId, randomEmail } from './utils';

export interface TenantUserFactoryInput {
  tenantId?: string;
  email?: string;
  passwordHash?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER';
  isActive?: boolean;
  emailVerified?: boolean;
  avatarUrl?: string | null;
  phone?: string | null;
}

/**
 * Creates a plain tenant user data object (no DB interaction).
 * Use for unit tests with mocked dependencies.
 */
export function createTenantUserFactory(
  tenantId: string,
  overrides?: Omit<TenantUserFactoryInput, 'tenantId'>,
) {
  const id = randomId();
  return {
    id: `tenant-user-${id}`,
    tenantId,
    email: randomEmail('tenant-user'),
    passwordHash: '$2b$10$test-hashed-password',
    firstName: 'Test',
    lastName: 'User',
    role: 'MEMBER' as const,
    isActive: true,
    emailVerified: false,
    avatarUrl: null,
    phone: null,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

/**
 * Creates a tenant user in the test database and returns it.
 * Use for E2E / integration tests.
 */
export async function createTenantUserDbFactory(
  prisma: PrismaClient,
  tenantId: string,
  overrides?: Omit<TenantUserFactoryInput, 'tenantId'>,
) {
  const id = randomId();
  const password = overrides?.password || 'TestPassword123!';
  const passwordHash =
    overrides?.passwordHash || (await bcrypt.hash(password, 10));

  return prisma.tenantUser.create({
    data: {
      tenantId,
      email: overrides?.email || randomEmail('tenant-user'),
      passwordHash,
      firstName: overrides?.firstName || 'Test',
      lastName: overrides?.lastName || `User ${id}`,
      role: overrides?.role || 'MEMBER',
      isActive: overrides?.isActive ?? true,
      emailVerified: overrides?.emailVerified ?? false,
      avatarUrl: overrides?.avatarUrl ?? null,
      phone: overrides?.phone ?? null,
    },
  });
}
