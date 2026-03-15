# Task 11: Subscription & Plan Limit Enforcement

## Summary
Implement subscription plans with feature gates and usage limits. A guard enforces limits before resource creation. Plan overrides allow per-tenant customization.

## Current State
- SubscriptionPlan and TenantSubscription models (Task 02).
- Auth + RBAC system (Tasks 09–10).

## Required Changes

### 11.1 Subscriptions Module

**File**: `backend/src/modules/subscriptions/`

**Admin endpoints** (platform admin):
- `POST /api/v1/admin/plans` — Create plan
- `GET /api/v1/admin/plans` — List plans
- `PATCH /api/v1/admin/plans/:id` — Update plan
- `DELETE /api/v1/admin/plans/:id` — Deactivate plan

**Tenant endpoints**:
- `GET /api/v1/tenants/:tenantId/subscription` — Get current subscription
- `GET /api/v1/plans` — List available plans (public)

**Admin tenant management**:
- `PUT /api/v1/admin/tenants/:tenantId/subscription` — Assign/change plan
- `PATCH /api/v1/admin/tenants/:tenantId/subscription/overrides` — Set limit overrides

### 11.2 Plan Limit Guard

**File**: `backend/src/common/guards/plan-limit.guard.ts`

```typescript
@Injectable()
export class PlanLimitGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const limit = this.reflector.get<string>('planLimit', context.getHandler());
    // e.g., 'users', 'storage', 'api-calls'

    // 1. Load tenant subscription + plan
    // 2. Get limit (from plan, or override if set)
    // 3. Count current usage
    // 4. Compare: if usage >= limit → throw PLAN_LIMIT_REACHED
  }
}
```

**Decorator**: `@PlanLimit('users')` on controller methods

### 11.3 Feature Gate Guard

**File**: `backend/src/common/guards/feature-gate.guard.ts`

Plans have a `features` JSON array (e.g., `["ai-planner", "api-access", "custom-domain"]`).

```typescript
@FeatureGate('ai-planner')
@Post('ai/plan')
async createPlan() { ... }
```

If the tenant's plan doesn't include the feature → `FEATURE_NOT_AVAILABLE`.

### 11.4 Default Plans (Seed)

```typescript
const PLANS = [
  {
    name: 'starter',
    displayName: 'Starter',
    priceMonthly: 0,
    priceYearly: 0,
    maxUsers: 3,
    maxStorage: 500,  // MB
    features: ['basic-analytics'],
  },
  {
    name: 'professional',
    displayName: 'Professional',
    priceMonthly: 49,
    priceYearly: 470,
    maxUsers: 25,
    maxStorage: 5000,
    features: ['basic-analytics', 'advanced-analytics', 'api-access', 'custom-domain'],
  },
  {
    name: 'enterprise',
    displayName: 'Enterprise',
    priceMonthly: 199,
    priceYearly: 1900,
    maxUsers: -1,  // unlimited
    maxStorage: 50000,
    features: ['basic-analytics', 'advanced-analytics', 'api-access', 'custom-domain', 'ai-planner', 'priority-support'],
  },
];
```

### 11.5 Usage Tracking

Track usage per tenant (count queries, not a separate table):
- `users` → `COUNT(*) WHERE tenantId AND isActive AND deletedAt IS NULL`
- `storage` → SUM of file sizes (from storage module, Task 15)

Cache usage counts in Redis (60s TTL).

### 11.6 Tests

- Test: `@PlanLimit('users')` blocks creation when limit reached
- Test: `@PlanLimit('users')` allows creation when under limit
- Test: Per-tenant overrides take precedence over plan limits
- Test: `maxUsers: -1` (unlimited) always passes
- Test: `@FeatureGate('ai-planner')` blocks if feature not in plan
- Test: `@FeatureGate('ai-planner')` allows if feature in plan
- Test: Plan CRUD endpoints work (admin only)
- Test: Tenant can view their subscription
- Test: Usage count cached in Redis

## Acceptance Criteria

1. Three default plans seeded (Starter, Professional, Enterprise)
2. `@PlanLimit()` guard enforces per-plan resource limits
3. `@FeatureGate()` guard enforces per-plan feature access
4. Per-tenant overrides supported
5. Usage counts cached in Redis (60s TTL)
6. Admin can manage plans and tenant subscriptions
7. All tests pass
