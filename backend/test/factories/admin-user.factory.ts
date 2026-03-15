import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomId, randomEmail } from './utils';

export interface AdminUserFactoryInput {
  email?: string;
  passwordHash?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: 'SUPER_ADMIN' | 'SUPPORT';
  isActive?: boolean;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string | null;
}

/**
 * Creates a plain admin user data object (no DB interaction).
 * Use for unit tests with mocked dependencies.
 */
export function createAdminUserFactory(overrides?: AdminUserFactoryInput) {
  const id = randomId();
  return {
    id: `admin-user-${id}`,
    email: randomEmail('admin'),
    passwordHash: '$2b$10$test-hashed-password',
    firstName: 'Admin',
    lastName: `User ${id}`,
    role: 'SUPER_ADMIN' as const,
    isActive: true,
    twoFactorEnabled: false,
    twoFactorSecret: null,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Creates an admin user in the test database and returns it.
 * Use for E2E / integration tests.
 */
export async function createAdminUserDbFactory(
  prisma: PrismaClient,
  overrides?: AdminUserFactoryInput,
) {
  const password = overrides?.password || 'TestPassword123!';
  const passwordHash =
    overrides?.passwordHash || (await bcrypt.hash(password, 10));

  return prisma.adminUser.create({
    data: {
      email: overrides?.email || randomEmail('admin'),
      passwordHash,
      firstName: overrides?.firstName || 'Admin',
      lastName: overrides?.lastName || 'User',
      role: overrides?.role || 'SUPER_ADMIN',
      isActive: overrides?.isActive ?? true,
      twoFactorEnabled: overrides?.twoFactorEnabled ?? false,
      twoFactorSecret: overrides?.twoFactorSecret ?? null,
    },
  });
}
