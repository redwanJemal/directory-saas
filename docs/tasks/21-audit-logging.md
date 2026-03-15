# Task 21: Audit Logging — Entity Change Tracking

## Summary
Implement immutable audit logging that tracks who changed what, when, and from where. Uses interceptors to automatically capture changes on write operations.

## Current State
- AuditLog model exists in Prisma schema (Task 02).
- Event system available (Task 17).

## Required Changes

### 21.1 Audit Interceptor

**File**: `backend/src/common/interceptors/audit.interceptor.ts`

Intercept POST, PATCH, PUT, DELETE requests and log:
```typescript
{
  tenantId: string;
  userId: string;
  userType: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: string;        // From URL: /api/v1/tenants/:id/users → 'users'
  entityId: string;      // From URL params or response body
  oldData: object;       // For UPDATE/DELETE: fetch before operation
  newData: object;       // For CREATE/UPDATE: from response
  metadata: {
    ipAddress: string;
    userAgent: string;
    method: string;
    url: string;
  };
}
```

### 21.2 Audit Service

**File**: `backend/src/modules/audit/audit.service.ts`

- `log(entry: AuditEntry)` — Create audit log entry
- `findAll(tenantId, query)` — Query audit logs with filters
- Entries are **immutable** — no update or delete

### 21.3 Audit Endpoints (Admin)

- `GET /api/v1/tenants/:tenantId/audit-logs` — List audit logs with filters
  - Filter by: entity, action, userId, dateRange
  - Sort by: createdAt (default desc)
- `GET /api/v1/admin/audit-logs` — Platform-wide audit logs

### 21.4 Selective Auditing

**Decorator**: `@Audited()` on controller methods that should be tracked.

Not everything needs auditing — skip health checks, reads, auth token refresh.

### 21.5 Sensitive Data Masking

Before storing `oldData`/`newData`, mask sensitive fields:
- `passwordHash` → `[REDACTED]`
- `twoFactorSecret` → `[REDACTED]`
- `tokenHash` → `[REDACTED]`

### 21.6 Tests

- Test: CREATE operation logged with newData
- Test: UPDATE operation logged with oldData and newData
- Test: DELETE operation logged with oldData
- Test: Audit log includes userId, tenantId, IP
- Test: Sensitive fields masked
- Test: Audit logs queryable with filters
- Test: Audit entries are immutable (no update/delete)

## Acceptance Criteria

1. Automatic audit logging via interceptor
2. Captures old/new data for changes
3. Immutable audit trail
4. Sensitive data masked
5. Queryable with filters (entity, action, user, date)
6. `@Audited()` decorator for selective auditing
7. All tests pass
