# Task 17: Domain Event System — Async Handlers

## Summary
Implement an in-process event bus for domain events using NestJS EventEmitter2. Events decouple modules and enable async side effects (audit, notifications, cache invalidation).

## Current State
- NestJS app with modules (Tasks 01–16).
- Audit logging module planned (Task 21).

## Required Changes

### 17.1 Event Bus

Use `@nestjs/event-emitter` (EventEmitter2):
- Register globally in `AppModule`
- Typed events with discriminated union pattern

### 17.2 Base Event

**File**: `backend/src/common/types/events.ts`

```typescript
export abstract class DomainEvent {
  readonly timestamp: string;
  readonly traceId?: string;
  readonly tenantId?: string;
  readonly userId?: string;

  constructor() {
    this.timestamp = new Date().toISOString();
    this.traceId = RequestContext.traceId;
    this.tenantId = RequestContext.tenantId;
    this.userId = RequestContext.userId;
  }
}

// Example events
export class TenantCreatedEvent extends DomainEvent {
  static readonly event = 'tenant.created';
  constructor(public readonly tenant: { id: string; name: string; slug: string }) { super(); }
}

export class UserCreatedEvent extends DomainEvent {
  static readonly event = 'user.created';
  constructor(public readonly user: { id: string; email: string; userType: string; tenantId?: string }) { super(); }
}

export class EntityUpdatedEvent extends DomainEvent {
  static readonly event = 'entity.updated';
  constructor(
    public readonly entity: string,
    public readonly entityId: string,
    public readonly changes: Record<string, { old: any; new: any }>,
  ) { super(); }
}
```

### 17.3 Event Emitting

Services emit events after successful operations:
```typescript
async create(dto: CreateTenantDto): Promise<ServiceResult<Tenant>> {
  const tenant = await this.prisma.tenant.create({ data: dto });
  this.eventEmitter.emit(TenantCreatedEvent.event, new TenantCreatedEvent(tenant));
  return ServiceResult.ok(tenant);
}
```

### 17.4 Event Handlers

```typescript
@OnEvent(TenantCreatedEvent.event, { async: true })
async handleTenantCreated(event: TenantCreatedEvent) {
  // Create default roles
  // Send welcome email
  // Log audit entry
}
```

**async: true** ensures handlers don't block the request.

### 17.5 Event Store (Optional)

**Table**: `domain_events` — persist events for replay/debugging:
```prisma
model DomainEvent {
  id        String   @id @default(uuid()) @db.Uuid
  type      String
  tenantId  String?  @map("tenant_id") @db.Uuid
  userId    String?  @map("user_id") @db.Uuid
  payload   Json
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz
  @@index([type, createdAt])
  @@index([tenantId, createdAt])
  @@map("domain_events")
}
```

### 17.6 Tests

- Test: Event emitted after service operation
- Test: Handler receives event with correct payload
- Test: Async handler doesn't block request
- Test: Event includes traceId and tenantId from context
- Test: Event stored in domain_events table
- Test: Multiple handlers can listen to same event

## Acceptance Criteria

1. EventEmitter2-based event bus
2. Typed domain events with base class
3. Async handlers for side effects
4. Events carry context (traceId, tenantId, userId)
5. Optional event store for debugging
6. All tests pass
