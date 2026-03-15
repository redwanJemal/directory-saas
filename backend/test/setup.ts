import { PrismaClient } from '@prisma/client';

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  process.env.DATABASE_URL ||
  'postgresql://directory:directory_secret@localhost:5432/directory_saas_test?schema=public';

let prismaInstance: PrismaClient | null = null;

/**
 * Returns a shared PrismaClient connected to the test database.
 * Reuses the same instance across the test suite.
 */
export function getTestPrisma(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      datasources: { db: { url: TEST_DATABASE_URL } },
      log: ['error'],
    });
  }
  return prismaInstance;
}

/**
 * Truncates all application tables (CASCADE) to reset state between tests.
 * Preserves database structure but removes all data.
 */
export async function truncateAllTables(prisma: PrismaClient): Promise<void> {
  const tables = [
    'ai_conversations',
    'embeddings',
    'notifications',
    'domain_events',
    'audit_logs',
    'tenant_subscriptions',
    'refresh_tokens',
    'user_roles',
    'role_permissions',
    'roles',
    'permissions',
    'tenant_users',
    'client_users',
    'subscription_plans',
    'tenants',
    'admin_users',
  ];

  // Disable triggers temporarily for clean truncation
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${tables.join(', ')} CASCADE`,
  );
}

/**
 * Sets up the test database: runs migrations and returns a connected PrismaClient.
 * Call this in beforeAll of your E2E test suites.
 */
export async function setupTestDb(): Promise<PrismaClient> {
  const prisma = getTestPrisma();
  await prisma.$connect();
  await truncateAllTables(prisma);
  return prisma;
}

/**
 * Tears down the test database: truncates tables and disconnects.
 * Call this in afterAll of your E2E test suites.
 */
export async function teardownTestDb(prisma: PrismaClient): Promise<void> {
  await truncateAllTables(prisma);
  await prisma.$disconnect();
  prismaInstance = null;
}
