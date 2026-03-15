import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AppLoggerService } from '../../common/services/logger.service';
import { EventStoreService } from './event-store.service';
import {
  TenantCreatedEvent,
  TenantUpdatedEvent,
  TenantSuspendedEvent,
  UserCreatedEvent,
  UserUpdatedEvent,
  UserDeactivatedEvent,
  UserLoggedInEvent,
  UserLoggedOutEvent,
  EntityCreatedEvent,
  EntityUpdatedEvent,
  EntityDeletedEvent,
  SubscriptionChangedEvent,
  RoleAssignedEvent,
  RoleRevokedEvent,
} from '../../common/types/events';

@Injectable()
export class EventHandlersService {
  constructor(
    private readonly eventStore: EventStoreService,
    private readonly logger: AppLoggerService,
  ) {}

  // === TENANT EVENTS ===

  @OnEvent(TenantCreatedEvent.event, { async: true })
  async handleTenantCreated(event: TenantCreatedEvent): Promise<void> {
    this.logger.log('Domain event: tenant.created', {
      tenantId: event.tenant.id,
      tenantSlug: event.tenant.slug,
      traceId: event.traceId,
    });
    await this.eventStore.store(TenantCreatedEvent.event, event);
  }

  @OnEvent(TenantUpdatedEvent.event, { async: true })
  async handleTenantUpdated(event: TenantUpdatedEvent): Promise<void> {
    this.logger.log('Domain event: tenant.updated', {
      tenantId: event.tenant.id,
      changes: Object.keys(event.changes),
      traceId: event.traceId,
    });
    await this.eventStore.store(TenantUpdatedEvent.event, event);
  }

  @OnEvent(TenantSuspendedEvent.event, { async: true })
  async handleTenantSuspended(event: TenantSuspendedEvent): Promise<void> {
    this.logger.log('Domain event: tenant.suspended', {
      tenantId: event.tenant.id,
      reason: event.reason,
      traceId: event.traceId,
    });
    await this.eventStore.store(TenantSuspendedEvent.event, event);
  }

  // === USER EVENTS ===

  @OnEvent(UserCreatedEvent.event, { async: true })
  async handleUserCreated(event: UserCreatedEvent): Promise<void> {
    this.logger.log('Domain event: user.created', {
      userId: event.user.id,
      userType: event.user.userType,
      tenantId: event.user.tenantId,
      traceId: event.traceId,
    });
    await this.eventStore.store(UserCreatedEvent.event, event);
  }

  @OnEvent(UserUpdatedEvent.event, { async: true })
  async handleUserUpdated(event: UserUpdatedEvent): Promise<void> {
    this.logger.log('Domain event: user.updated', {
      userId: event.user.id,
      changes: Object.keys(event.changes),
      traceId: event.traceId,
    });
    await this.eventStore.store(UserUpdatedEvent.event, event);
  }

  @OnEvent(UserDeactivatedEvent.event, { async: true })
  async handleUserDeactivated(event: UserDeactivatedEvent): Promise<void> {
    this.logger.log('Domain event: user.deactivated', {
      userId: event.user.id,
      userType: event.user.userType,
      traceId: event.traceId,
    });
    await this.eventStore.store(UserDeactivatedEvent.event, event);
  }

  // === AUTH EVENTS ===

  @OnEvent(UserLoggedInEvent.event, { async: true })
  async handleUserLoggedIn(event: UserLoggedInEvent): Promise<void> {
    this.logger.log('Domain event: auth.login', {
      userId: event.user.id,
      userType: event.user.userType,
      ipAddress: event.ipAddress,
      traceId: event.traceId,
    });
    await this.eventStore.store(UserLoggedInEvent.event, event);
  }

  @OnEvent(UserLoggedOutEvent.event, { async: true })
  async handleUserLoggedOut(event: UserLoggedOutEvent): Promise<void> {
    this.logger.log('Domain event: auth.logout', {
      userId: event.user.id,
      traceId: event.traceId,
    });
    await this.eventStore.store(UserLoggedOutEvent.event, event);
  }

  // === ENTITY EVENTS ===

  @OnEvent(EntityCreatedEvent.event, { async: true })
  async handleEntityCreated(event: EntityCreatedEvent): Promise<void> {
    this.logger.log('Domain event: entity.created', {
      entity: event.entity,
      entityId: event.entityId,
      traceId: event.traceId,
    });
    await this.eventStore.store(EntityCreatedEvent.event, event);
  }

  @OnEvent(EntityUpdatedEvent.event, { async: true })
  async handleEntityUpdated(event: EntityUpdatedEvent): Promise<void> {
    this.logger.log('Domain event: entity.updated', {
      entity: event.entity,
      entityId: event.entityId,
      changes: Object.keys(event.changes),
      traceId: event.traceId,
    });
    await this.eventStore.store(EntityUpdatedEvent.event, event);
  }

  @OnEvent(EntityDeletedEvent.event, { async: true })
  async handleEntityDeleted(event: EntityDeletedEvent): Promise<void> {
    this.logger.log('Domain event: entity.deleted', {
      entity: event.entity,
      entityId: event.entityId,
      traceId: event.traceId,
    });
    await this.eventStore.store(EntityDeletedEvent.event, event);
  }

  // === SUBSCRIPTION EVENTS ===

  @OnEvent(SubscriptionChangedEvent.event, { async: true })
  async handleSubscriptionChanged(
    event: SubscriptionChangedEvent,
  ): Promise<void> {
    this.logger.log('Domain event: subscription.changed', {
      tenantId: event.subscription.tenantId,
      newPlanId: event.subscription.newPlanId,
      status: event.subscription.status,
      traceId: event.traceId,
    });
    await this.eventStore.store(SubscriptionChangedEvent.event, event);
  }

  // === ROLE EVENTS ===

  @OnEvent(RoleAssignedEvent.event, { async: true })
  async handleRoleAssigned(event: RoleAssignedEvent): Promise<void> {
    this.logger.log('Domain event: role.assigned', {
      userId: event.assignment.userId,
      roleId: event.assignment.roleId,
      roleName: event.assignment.roleName,
      traceId: event.traceId,
    });
    await this.eventStore.store(RoleAssignedEvent.event, event);
  }

  @OnEvent(RoleRevokedEvent.event, { async: true })
  async handleRoleRevoked(event: RoleRevokedEvent): Promise<void> {
    this.logger.log('Domain event: role.revoked', {
      userId: event.assignment.userId,
      roleId: event.assignment.roleId,
      roleName: event.assignment.roleName,
      traceId: event.traceId,
    });
    await this.eventStore.store(RoleRevokedEvent.event, event);
  }
}
