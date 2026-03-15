# Task 08: PostgreSQL Row-Level Security Policies

## Summary
Add database-level tenant isolation via PostgreSQL RLS as a safety net behind application-level filtering. This ensures data isolation even if application code has bugs.

## Current State
- Multi-tenancy middleware sets tenant context per request (Task 07).
- Application-level filtering uses `where: { tenantId }` in Prisma queries.

## Required Changes

### 8.1 RLS SQL Migration

**File**: `docker/postgres/rls-policies.sql`

For every tenant-scoped table, create:
```sql
-- Enable RLS
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;

-- Policy: rows visible only when session tenant matches
CREATE POLICY tenant_isolation ON tenant_users
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Allow the application role to set the session variable
ALTER TABLE tenant_users FORCE ROW LEVEL SECURITY;
```

Tables to protect:
- `tenant_users`
- `roles`
- `role_permissions`
- `user_roles`
- `audit_logs` (tenant-scoped ones)
- Any future tenant-scoped table

Tables to SKIP (platform-wide):
- `admin_users`
- `tenants`
- `subscription_plans`
- `permissions`
- `client_users`
- `refresh_tokens`

### 8.2 Prisma Extension for RLS

**File**: `backend/src/prisma/prisma-rls.extension.ts`

Prisma client extension that sets the PostgreSQL session variable before each query:
```typescript
// Before each query, run: SET LOCAL app.current_tenant_id = 'uuid';
```

Use `$extends` with a `query` extension:
```typescript
export function withRLS(prisma: PrismaClient, tenantId: string) {
  return prisma.$extends({
    query: {
      $allOperations({ operation, model, args, query }) {
        return prisma.$transaction(async (tx) => {
          await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`;
          return query(args);
        });
      },
    },
  });
}
```

### 8.3 RLS Middleware Integration

Update `PrismaService` or create a `TenantPrismaService` that:
1. Gets `tenantId` from `RequestContext`
2. Sets the session variable before queries
3. Falls back to application-level filtering if RLS is disabled (for admin routes)

### 8.4 Admin Bypass

Platform admin routes need to query across tenants. Use a separate connection or bypass RLS:
```sql
-- Superuser role bypasses RLS by default
-- OR: Create a policy with `TO app_admin` that allows all
```

### 8.5 Migration Script

Create an Alembic/Prisma-compatible migration that:
1. Enables RLS on all tenant-scoped tables
2. Creates policies
3. Is idempotent (safe to re-run)

### 8.6 Tests

- Test: Tenant A cannot read tenant B's data with RLS enabled
- Test: Admin can read across tenants (bypass)
- Test: New records automatically scoped to current tenant
- Test: RLS works even without application-level `where` clause
- Test: Session variable is set correctly per request

## Acceptance Criteria

1. RLS enabled on all tenant-scoped tables
2. Policies use `app.current_tenant_id` session variable
3. Prisma sets session variable before each query in tenant context
4. Admin routes bypass RLS
5. Double-layer protection: application filter + database RLS
6. All tests pass
