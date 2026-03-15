import { RequestContext } from '../services/request-context';

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

// === TENANT EVENTS ===

export class TenantCreatedEvent extends DomainEvent {
  static readonly event = 'tenant.created';
  constructor(
    public readonly tenant: { id: string; name: string; slug: string },
  ) {
    super();
  }
}

export class TenantUpdatedEvent extends DomainEvent {
  static readonly event = 'tenant.updated';
  constructor(
    public readonly tenant: { id: string; name: string; slug: string },
    public readonly changes: Record<string, { old: unknown; new: unknown }>,
  ) {
    super();
  }
}

export class TenantSuspendedEvent extends DomainEvent {
  static readonly event = 'tenant.suspended';
  constructor(
    public readonly tenant: { id: string; name: string; slug: string },
    public readonly reason?: string,
  ) {
    super();
  }
}

// === USER EVENTS ===

export class UserCreatedEvent extends DomainEvent {
  static readonly event = 'user.created';
  constructor(
    public readonly user: {
      id: string;
      email: string;
      userType: string;
      tenantId?: string;
    },
  ) {
    super();
  }
}

export class UserUpdatedEvent extends DomainEvent {
  static readonly event = 'user.updated';
  constructor(
    public readonly user: {
      id: string;
      email: string;
      userType: string;
      tenantId?: string;
    },
    public readonly changes: Record<string, { old: unknown; new: unknown }>,
  ) {
    super();
  }
}

export class UserDeactivatedEvent extends DomainEvent {
  static readonly event = 'user.deactivated';
  constructor(
    public readonly user: {
      id: string;
      email: string;
      userType: string;
      tenantId?: string;
    },
  ) {
    super();
  }
}

// === AUTH EVENTS ===

export class UserLoggedInEvent extends DomainEvent {
  static readonly event = 'auth.login';
  constructor(
    public readonly user: {
      id: string;
      email: string;
      userType: string;
      tenantId?: string;
    },
    public readonly ipAddress?: string,
  ) {
    super();
  }
}

export class UserLoggedOutEvent extends DomainEvent {
  static readonly event = 'auth.logout';
  constructor(
    public readonly user: {
      id: string;
      userType: string;
      tenantId?: string;
    },
  ) {
    super();
  }
}

// === ENTITY EVENTS (GENERIC) ===

export class EntityCreatedEvent extends DomainEvent {
  static readonly event = 'entity.created';
  constructor(
    public readonly entity: string,
    public readonly entityId: string,
    public readonly data: Record<string, unknown>,
  ) {
    super();
  }
}

export class EntityUpdatedEvent extends DomainEvent {
  static readonly event = 'entity.updated';
  constructor(
    public readonly entity: string,
    public readonly entityId: string,
    public readonly changes: Record<string, { old: unknown; new: unknown }>,
  ) {
    super();
  }
}

export class EntityDeletedEvent extends DomainEvent {
  static readonly event = 'entity.deleted';
  constructor(
    public readonly entity: string,
    public readonly entityId: string,
  ) {
    super();
  }
}

// === SUBSCRIPTION EVENTS ===

export class SubscriptionChangedEvent extends DomainEvent {
  static readonly event = 'subscription.changed';
  constructor(
    public readonly subscription: {
      tenantId: string;
      oldPlanId?: string;
      newPlanId: string;
      status: string;
    },
  ) {
    super();
  }
}

// === ROLE EVENTS ===

export class RoleAssignedEvent extends DomainEvent {
  static readonly event = 'role.assigned';
  constructor(
    public readonly assignment: {
      userId: string;
      roleId: string;
      roleName: string;
      tenantId: string;
    },
  ) {
    super();
  }
}

export class RoleRevokedEvent extends DomainEvent {
  static readonly event = 'role.revoked';
  constructor(
    public readonly assignment: {
      userId: string;
      roleId: string;
      roleName: string;
      tenantId: string;
    },
  ) {
    super();
  }
}

// === EVENT TYPE MAP ===

export const DomainEvents = {
  TENANT_CREATED: TenantCreatedEvent.event,
  TENANT_UPDATED: TenantUpdatedEvent.event,
  TENANT_SUSPENDED: TenantSuspendedEvent.event,
  USER_CREATED: UserCreatedEvent.event,
  USER_UPDATED: UserUpdatedEvent.event,
  USER_DEACTIVATED: UserDeactivatedEvent.event,
  AUTH_LOGIN: UserLoggedInEvent.event,
  AUTH_LOGOUT: UserLoggedOutEvent.event,
  ENTITY_CREATED: EntityCreatedEvent.event,
  ENTITY_UPDATED: EntityUpdatedEvent.event,
  ENTITY_DELETED: EntityDeletedEvent.event,
  SUBSCRIPTION_CHANGED: SubscriptionChangedEvent.event,
  ROLE_ASSIGNED: RoleAssignedEvent.event,
  ROLE_REVOKED: RoleRevokedEvent.event,
} as const;
