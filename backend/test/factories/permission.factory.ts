import { PrismaClient } from '@prisma/client';
import { randomId } from './utils';

export interface PermissionFactoryInput {
  resource?: string;
  action?: string;
  description?: string | null;
}

/**
 * Creates a plain permission data object (no DB interaction).
 * Use for unit tests with mocked dependencies.
 */
export function createPermissionFactory(overrides?: PermissionFactoryInput) {
  const id = randomId();
  return {
    id: `permission-${id}`,
    resource: `resource-${id}`,
    action: 'read',
    description: null,
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Creates a permission in the test database and returns it.
 * Use for E2E / integration tests.
 */
export async function createPermissionDbFactory(
  prisma: PrismaClient,
  overrides?: PermissionFactoryInput,
) {
  const id = randomId();
  return prisma.permission.create({
    data: {
      resource: overrides?.resource || `resource-${id}`,
      action: overrides?.action || 'read',
      description: overrides?.description ?? null,
    },
  });
}
