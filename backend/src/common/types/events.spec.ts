import { RequestContext } from '../services/request-context';
import {
  DomainEvent,
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
  DomainEvents,
} from './events';

describe('DomainEvent', () => {
  describe('base class', () => {
    it('should set timestamp on construction', () => {
      const before = new Date().toISOString();
      const event = new TenantCreatedEvent({ id: '1', name: 'Test', slug: 'test' });
      const after = new Date().toISOString();

      expect(event.timestamp).toBeDefined();
      expect(event.timestamp >= before).toBe(true);
      expect(event.timestamp <= after).toBe(true);
    });

    it('should capture traceId from RequestContext', () => {
      RequestContext.run(() => {
        RequestContext.set('traceId', 'trace-123');
        const event = new TenantCreatedEvent({ id: '1', name: 'Test', slug: 'test' });
        expect(event.traceId).toBe('trace-123');
      });
    });

    it('should capture tenantId from RequestContext', () => {
      RequestContext.run(() => {
        RequestContext.set('tenantId', 'tenant-456');
        const event = new TenantCreatedEvent({ id: '1', name: 'Test', slug: 'test' });
        expect(event.tenantId).toBe('tenant-456');
      });
    });

    it('should capture userId from RequestContext', () => {
      RequestContext.run(() => {
        RequestContext.set('userId', 'user-789');
        const event = new TenantCreatedEvent({ id: '1', name: 'Test', slug: 'test' });
        expect(event.userId).toBe('user-789');
      });
    });

    it('should have undefined context fields outside RequestContext', () => {
      const event = new TenantCreatedEvent({ id: '1', name: 'Test', slug: 'test' });
      expect(event.traceId).toBeUndefined();
      expect(event.tenantId).toBeUndefined();
      expect(event.userId).toBeUndefined();
    });
  });

  describe('TenantCreatedEvent', () => {
    it('should have correct static event name', () => {
      expect(TenantCreatedEvent.event).toBe('tenant.created');
    });

    it('should store tenant data', () => {
      const tenant = { id: 'uuid-1', name: 'Acme', slug: 'acme' };
      const event = new TenantCreatedEvent(tenant);
      expect(event.tenant).toEqual(tenant);
    });
  });

  describe('TenantUpdatedEvent', () => {
    it('should have correct static event name', () => {
      expect(TenantUpdatedEvent.event).toBe('tenant.updated');
    });

    it('should store tenant and changes', () => {
      const tenant = { id: 'uuid-1', name: 'Acme New', slug: 'acme' };
      const changes = { name: { old: 'Acme', new: 'Acme New' } };
      const event = new TenantUpdatedEvent(tenant, changes);
      expect(event.tenant).toEqual(tenant);
      expect(event.changes).toEqual(changes);
    });
  });

  describe('TenantSuspendedEvent', () => {
    it('should have correct static event name', () => {
      expect(TenantSuspendedEvent.event).toBe('tenant.suspended');
    });

    it('should store reason', () => {
      const tenant = { id: 'uuid-1', name: 'Acme', slug: 'acme' };
      const event = new TenantSuspendedEvent(tenant, 'Non-payment');
      expect(event.reason).toBe('Non-payment');
    });
  });

  describe('UserCreatedEvent', () => {
    it('should have correct static event name', () => {
      expect(UserCreatedEvent.event).toBe('user.created');
    });

    it('should store user data', () => {
      const user = { id: 'u1', email: 'test@test.com', userType: 'tenant', tenantId: 't1' };
      const event = new UserCreatedEvent(user);
      expect(event.user).toEqual(user);
    });
  });

  describe('UserUpdatedEvent', () => {
    it('should have correct static event name', () => {
      expect(UserUpdatedEvent.event).toBe('user.updated');
    });
  });

  describe('UserDeactivatedEvent', () => {
    it('should have correct static event name', () => {
      expect(UserDeactivatedEvent.event).toBe('user.deactivated');
    });
  });

  describe('UserLoggedInEvent', () => {
    it('should have correct static event name', () => {
      expect(UserLoggedInEvent.event).toBe('auth.login');
    });

    it('should store ipAddress', () => {
      const user = { id: 'u1', email: 'test@test.com', userType: 'tenant' };
      const event = new UserLoggedInEvent(user, '192.168.1.1');
      expect(event.ipAddress).toBe('192.168.1.1');
    });
  });

  describe('UserLoggedOutEvent', () => {
    it('should have correct static event name', () => {
      expect(UserLoggedOutEvent.event).toBe('auth.logout');
    });
  });

  describe('EntityCreatedEvent', () => {
    it('should have correct static event name', () => {
      expect(EntityCreatedEvent.event).toBe('entity.created');
    });

    it('should store entity info and data', () => {
      const event = new EntityCreatedEvent('role', 'role-1', { name: 'Admin' });
      expect(event.entity).toBe('role');
      expect(event.entityId).toBe('role-1');
      expect(event.data).toEqual({ name: 'Admin' });
    });
  });

  describe('EntityUpdatedEvent', () => {
    it('should have correct static event name', () => {
      expect(EntityUpdatedEvent.event).toBe('entity.updated');
    });

    it('should store changes', () => {
      const changes = { name: { old: 'Admin', new: 'Super Admin' } };
      const event = new EntityUpdatedEvent('role', 'role-1', changes);
      expect(event.changes).toEqual(changes);
    });
  });

  describe('EntityDeletedEvent', () => {
    it('should have correct static event name', () => {
      expect(EntityDeletedEvent.event).toBe('entity.deleted');
    });
  });

  describe('SubscriptionChangedEvent', () => {
    it('should have correct static event name', () => {
      expect(SubscriptionChangedEvent.event).toBe('subscription.changed');
    });

    it('should store subscription data', () => {
      const sub = { tenantId: 't1', oldPlanId: 'p1', newPlanId: 'p2', status: 'ACTIVE' };
      const event = new SubscriptionChangedEvent(sub);
      expect(event.subscription).toEqual(sub);
    });
  });

  describe('RoleAssignedEvent', () => {
    it('should have correct static event name', () => {
      expect(RoleAssignedEvent.event).toBe('role.assigned');
    });
  });

  describe('RoleRevokedEvent', () => {
    it('should have correct static event name', () => {
      expect(RoleRevokedEvent.event).toBe('role.revoked');
    });
  });

  describe('DomainEvents map', () => {
    it('should contain all event names', () => {
      expect(DomainEvents.TENANT_CREATED).toBe('tenant.created');
      expect(DomainEvents.TENANT_UPDATED).toBe('tenant.updated');
      expect(DomainEvents.TENANT_SUSPENDED).toBe('tenant.suspended');
      expect(DomainEvents.USER_CREATED).toBe('user.created');
      expect(DomainEvents.USER_UPDATED).toBe('user.updated');
      expect(DomainEvents.USER_DEACTIVATED).toBe('user.deactivated');
      expect(DomainEvents.AUTH_LOGIN).toBe('auth.login');
      expect(DomainEvents.AUTH_LOGOUT).toBe('auth.logout');
      expect(DomainEvents.ENTITY_CREATED).toBe('entity.created');
      expect(DomainEvents.ENTITY_UPDATED).toBe('entity.updated');
      expect(DomainEvents.ENTITY_DELETED).toBe('entity.deleted');
      expect(DomainEvents.SUBSCRIPTION_CHANGED).toBe('subscription.changed');
      expect(DomainEvents.ROLE_ASSIGNED).toBe('role.assigned');
      expect(DomainEvents.ROLE_REVOKED).toBe('role.revoked');
    });
  });
});
