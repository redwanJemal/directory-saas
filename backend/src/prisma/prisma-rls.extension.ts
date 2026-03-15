import { PrismaClient } from '@prisma/client';

/**
 * Type alias for the extended Prisma client returned by withRLS/withRLSBypass.
 * Uses the return type of $extends which preserves all model accessors.
 */
export type RLSExtendedClient = ReturnType<typeof withRLS>;

/**
 * List of tenant-scoped Prisma model names that have RLS policies.
 * Used to determine which operations need tenant context.
 */
export const RLS_PROTECTED_MODELS = [
  'TenantUser',
  'Role',
  'RolePermission',
  'UserRole',
  'AuditLog',
  'TenantSubscription',
] as const;

/**
 * Creates a Prisma client extension that sets the PostgreSQL session variable
 * `app.current_tenant_id` before each query on tenant-scoped tables.
 *
 * Each operation is wrapped in an interactive transaction to ensure the
 * `SET LOCAL` and the actual query execute on the same database connection.
 *
 * Usage:
 *   const tenantPrisma = withRLS(prisma, tenantId);
 *   const users = await tenantPrisma.tenantUser.findMany();
 */
export function withRLS(prisma: PrismaClient, tenantId: string) {
  return prisma.$extends({
    query: {
      $allOperations({ model, operation, args, query }) {
        // Only wrap tenant-scoped models in RLS transactions
        if (!model || !RLS_PROTECTED_MODELS.includes(model as any)) {
          return query(args);
        }

        return prisma.$transaction(async (tx) => {
          await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`;
          const modelAccessor = model.charAt(0).toLowerCase() + model.slice(1);
          return (tx as any)[modelAccessor][operation](args);
        });
      },
    },
  });
}

/**
 * Creates a Prisma client extension that bypasses RLS for admin/platform queries.
 * Sets `app.bypass_rls` to 'on' so all RLS policies allow access.
 *
 * Usage:
 *   const adminPrisma = withRLSBypass(prisma);
 *   const allUsers = await adminPrisma.tenantUser.findMany();
 */
export function withRLSBypass(prisma: PrismaClient) {
  return prisma.$extends({
    query: {
      $allOperations({ model, operation, args, query }) {
        if (!model || !RLS_PROTECTED_MODELS.includes(model as any)) {
          return query(args);
        }

        return prisma.$transaction(async (tx) => {
          await tx.$executeRaw`SELECT set_config('app.bypass_rls', 'on', true)`;
          const modelAccessor = model.charAt(0).toLowerCase() + model.slice(1);
          return (tx as any)[modelAccessor][operation](args);
        });
      },
    },
  });
}
