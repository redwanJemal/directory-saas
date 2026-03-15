import { PrismaClient } from '@prisma/client';
import { randomId } from './utils';

export interface RoleFactoryInput {
  tenantId?: string;
  name?: string;
  displayName?: string;
  description?: string | null;
  isSystem?: boolean;
}

/**
 * Creates a plain role data object (no DB interaction).
 * Use for unit tests with mocked dependencies.
 */
export function createRoleFactory(
  tenantId: string,
  overrides?: Omit<RoleFactoryInput, 'tenantId'>,
) {
  const id = randomId();
  return {
    id: `role-${id}`,
    tenantId,
    name: `test-role-${id}`,
    displayName: `Test Role ${id}`,
    description: null,
    isSystem: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Creates a role in the test database and returns it.
 * Use for E2E / integration tests.
 */
export async function createRoleDbFactory(
  prisma: PrismaClient,
  tenantId: string,
  overrides?: Omit<RoleFactoryInput, 'tenantId'>,
) {
  const id = randomId();
  return prisma.role.create({
    data: {
      tenantId,
      name: overrides?.name || `test-role-${id}`,
      displayName: overrides?.displayName || `Test Role ${id}`,
      description: overrides?.description ?? null,
      isSystem: overrides?.isSystem ?? false,
    },
  });
}
