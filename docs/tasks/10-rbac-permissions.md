# Task 10: RBAC & Permissions System

## Summary
Implement dynamic role-based access control with fine-grained permissions. Roles are per-tenant, permissions are system-defined. Permission checks are cached for performance.

## Current State
- Auth system with JWT and user types (Task 09).
- Role, Permission, RolePermission, UserRole models (Task 02).

## Required Changes

### 10.1 Roles Module

**File**: `backend/src/modules/roles/`

CRUD for roles within a tenant:
- `POST /api/v1/tenants/:tenantId/roles` — Create role
- `GET /api/v1/tenants/:tenantId/roles` — List roles
- `GET /api/v1/tenants/:tenantId/roles/:id` — Get role with permissions
- `PATCH /api/v1/tenants/:tenantId/roles/:id` — Update role
- `DELETE /api/v1/tenants/:tenantId/roles/:id` — Delete role (not system roles)
- `PUT /api/v1/tenants/:tenantId/roles/:id/permissions` — Set role permissions
- `PUT /api/v1/tenants/:tenantId/users/:userId/roles` — Assign roles to user

### 10.2 Permission Definitions

**File**: `backend/src/modules/roles/permissions.seed.ts`

Seed all permissions in `resource:action` format:
```typescript
const PERMISSIONS = [
  // Tenants (admin only)
  { resource: 'tenants', action: 'create' },
  { resource: 'tenants', action: 'read' },
  { resource: 'tenants', action: 'update' },
  { resource: 'tenants', action: 'delete' },

  // Users
  { resource: 'users', action: 'create' },
  { resource: 'users', action: 'read' },
  { resource: 'users', action: 'update' },
  { resource: 'users', action: 'delete' },
  { resource: 'users', action: 'manage' },  // wildcard

  // Roles
  { resource: 'roles', action: 'create' },
  { resource: 'roles', action: 'read' },
  { resource: 'roles', action: 'update' },
  { resource: 'roles', action: 'delete' },

  // Subscriptions
  { resource: 'subscriptions', action: 'read' },
  { resource: 'subscriptions', action: 'manage' },

  // Audit logs
  { resource: 'audit-logs', action: 'read' },

  // Settings
  { resource: 'settings', action: 'read' },
  { resource: 'settings', action: 'update' },
];
```

### 10.3 Roles Guard

**File**: `backend/src/common/guards/roles.guard.ts`

Check both role-based and permission-based access:

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  // Check @Roles('OWNER', 'ADMIN') — user.role must be in list
  // Check @RequirePermission('users:create') — user must have permission
  // 'resource:manage' acts as wildcard for all actions on that resource
}
```

**Permission caching** (30s TTL, in-memory Map):
```typescript
private permCache = new Map<string, { perms: Set<string>; ts: number }>();
```
- Key: `userId`
- Load permissions from DB (user → roles → permissions)
- Cache for 30 seconds
- Invalidate on role/permission change

### 10.4 Decorators

**File**: `backend/src/common/decorators/`

- `@Roles(...roles: string[])` — Require specific role names
- `@RequirePermission(permission: string)` — Require `resource:action` permission
- `@Public()` — Skip auth entirely

### 10.5 Default Roles (Seed)

On tenant creation, auto-create system roles:
- **Owner** — All permissions (system, non-deletable)
- **Admin** — All except subscription management
- **Manager** — Read/write on domain resources
- **Member** — Read-only

### 10.6 Tests

- Test: Guard allows access with correct role
- Test: Guard denies access with wrong role
- Test: Guard allows access with correct permission
- Test: `manage` permission grants all actions for a resource
- Test: Permission cache is hit on second request
- Test: Permission cache invalidated on role change
- Test: System roles cannot be deleted
- Test: Permissions seeded on startup
- Test: Roles are tenant-scoped (tenant A can't see tenant B's roles)

## Acceptance Criteria

1. Dynamic roles per tenant with assignable permissions
2. `@Roles()` decorator for role-based checks
3. `@RequirePermission()` decorator for permission-based checks
4. `manage` acts as wildcard for all actions on a resource
5. Permission cache with 30s TTL
6. Default system roles created on tenant creation
7. All tests pass
