-- ============================================================================
-- PostgreSQL Row-Level Security Policies for Multi-Tenant Isolation
-- ============================================================================
--
-- This script enables RLS on all tenant-scoped tables and creates policies
-- that enforce tenant isolation at the database level.
--
-- Session variables used:
--   app.current_tenant_id  — UUID of the current tenant (set per-transaction)
--   app.bypass_rls         — Set to 'on' for admin/platform-wide queries
--
-- Tables protected:
--   tenant_users, roles, role_permissions, user_roles,
--   audit_logs, tenant_subscriptions
--
-- Tables skipped (platform-wide):
--   admin_users, tenants, subscription_plans, permissions,
--   client_users, refresh_tokens
--
-- This script is idempotent — safe to re-run.
-- ============================================================================

-- ============================================================================
-- tenant_users
-- ============================================================================
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON tenant_users;
CREATE POLICY tenant_isolation ON tenant_users
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR (
      current_setting('app.current_tenant_id', true) <> ''
      AND tenant_id = current_setting('app.current_tenant_id', true)::uuid
    )
  );

-- ============================================================================
-- roles
-- ============================================================================
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON roles;
CREATE POLICY tenant_isolation ON roles
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR (
      current_setting('app.current_tenant_id', true) <> ''
      AND tenant_id = current_setting('app.current_tenant_id', true)::uuid
    )
  );

-- ============================================================================
-- role_permissions (tenant_id derived via roles.tenant_id)
-- ============================================================================
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON role_permissions;
CREATE POLICY tenant_isolation ON role_permissions
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR (
      current_setting('app.current_tenant_id', true) <> ''
      AND role_id IN (
        SELECT id FROM roles
        WHERE tenant_id = current_setting('app.current_tenant_id', true)::uuid
      )
    )
  );

-- ============================================================================
-- user_roles (tenant_id derived via roles.tenant_id)
-- ============================================================================
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON user_roles;
CREATE POLICY tenant_isolation ON user_roles
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR (
      current_setting('app.current_tenant_id', true) <> ''
      AND role_id IN (
        SELECT id FROM roles
        WHERE tenant_id = current_setting('app.current_tenant_id', true)::uuid
      )
    )
  );

-- ============================================================================
-- audit_logs (optional tenant_id — platform logs have NULL tenant_id)
-- ============================================================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON audit_logs;
CREATE POLICY tenant_isolation ON audit_logs
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR (
      current_setting('app.current_tenant_id', true) <> ''
      AND tenant_id IS NOT NULL
      AND tenant_id = current_setting('app.current_tenant_id', true)::uuid
    )
  );

-- ============================================================================
-- tenant_subscriptions
-- ============================================================================
ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_subscriptions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON tenant_subscriptions;
CREATE POLICY tenant_isolation ON tenant_subscriptions
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR (
      current_setting('app.current_tenant_id', true) <> ''
      AND tenant_id = current_setting('app.current_tenant_id', true)::uuid
    )
  );
