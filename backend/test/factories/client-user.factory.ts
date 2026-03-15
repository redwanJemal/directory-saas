import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomId, randomEmail } from './utils';

export interface ClientUserFactoryInput {
  email?: string;
  passwordHash?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  avatarUrl?: string | null;
  isActive?: boolean;
  emailVerified?: boolean;
}

/**
 * Creates a plain client user data object (no DB interaction).
 * Use for unit tests with mocked dependencies.
 */
export function createClientUserFactory(overrides?: ClientUserFactoryInput) {
  const id = randomId();
  return {
    id: `client-user-${id}`,
    email: randomEmail('client'),
    passwordHash: '$2b$10$test-hashed-password',
    firstName: 'Client',
    lastName: `User ${id}`,
    phone: null,
    avatarUrl: null,
    isActive: true,
    emailVerified: false,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

/**
 * Creates a client user in the test database and returns it.
 * Use for E2E / integration tests.
 */
export async function createClientUserDbFactory(
  prisma: PrismaClient,
  overrides?: ClientUserFactoryInput,
) {
  const password = overrides?.password || 'TestPassword123!';
  const passwordHash =
    overrides?.passwordHash || (await bcrypt.hash(password, 10));

  return prisma.clientUser.create({
    data: {
      email: overrides?.email || randomEmail('client'),
      passwordHash,
      firstName: overrides?.firstName || 'Client',
      lastName: overrides?.lastName || 'User',
      phone: overrides?.phone ?? null,
      avatarUrl: overrides?.avatarUrl ?? null,
      isActive: overrides?.isActive ?? true,
      emailVerified: overrides?.emailVerified ?? false,
    },
  });
}
