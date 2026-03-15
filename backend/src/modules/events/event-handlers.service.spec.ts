import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { EventEmitter2 } from 'eventemitter2';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventHandlersService } from './event-handlers.service';
import { EventStoreService } from './event-store.service';
import { AppLoggerService } from '../../common/services/logger.service';
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
import { ServiceResult } from '../../common/types';

describe('EventHandlersService', () => {
  let service: EventHandlersService;
  let app: INestApplication;
  let eventEmitter: EventEmitter2;
  let mockEventStore: Record<string, jest.Mock>;
  let mockLogger: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockEventStore = {
      store: jest.fn().mockResolvedValue(ServiceResult.ok({ id: 'event-1' })),
    };

    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot({ wildcard: true, delimiter: '.' })],
      providers: [
        EventHandlersService,
        { provide: EventStoreService, useValue: mockEventStore },
        { provide: AppLoggerService, useValue: mockLogger },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    service = app.get<EventHandlersService>(EventHandlersService);
    eventEmitter = app.get<EventEmitter2>(EventEmitter2);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  describe('handleTenantCreated', () => {
    it('should log and store tenant.created event', async () => {
      const event = new TenantCreatedEvent({ id: 't1', name: 'Acme', slug: 'acme' });

      await service.handleTenantCreated(event);

      expect(mockLogger.log).toHaveBeenCalledWith(
        'Domain event: tenant.created',
        expect.objectContaining({ tenantId: 't1', tenantSlug: 'acme' }),
      );
      expect(mockEventStore.store).toHaveBeenCalledWith('tenant.created', event);
    });
  });

  describe('handleTenantUpdated', () => {
    it('should log and store tenant.updated event', async () => {
      const event = new TenantUpdatedEvent(
        { id: 't1', name: 'New Name', slug: 'acme' },
        { name: { old: 'Old Name', new: 'New Name' } },
      );

      await service.handleTenantUpdated(event);

      expect(mockLogger.log).toHaveBeenCalledWith(
        'Domain event: tenant.updated',
        expect.objectContaining({ changes: ['name'] }),
      );
      expect(mockEventStore.store).toHaveBeenCalledWith('tenant.updated', event);
    });
  });

  describe('handleTenantSuspended', () => {
    it('should log and store tenant.suspended event', async () => {
      const event = new TenantSuspendedEvent(
        { id: 't1', name: 'Acme', slug: 'acme' },
        'Non-payment',
      );

      await service.handleTenantSuspended(event);

      expect(mockLogger.log).toHaveBeenCalledWith(
        'Domain event: tenant.suspended',
        expect.objectContaining({ reason: 'Non-payment' }),
      );
      expect(mockEventStore.store).toHaveBeenCalledWith('tenant.suspended', event);
    });
  });

  describe('handleUserCreated', () => {
    it('should log and store user.created event', async () => {
      const event = new UserCreatedEvent({
        id: 'u1',
        email: 'user@test.com',
        userType: 'tenant',
        tenantId: 't1',
      });

      await service.handleUserCreated(event);

      expect(mockLogger.log).toHaveBeenCalledWith(
        'Domain event: user.created',
        expect.objectContaining({ userId: 'u1', userType: 'tenant' }),
      );
      expect(mockEventStore.store).toHaveBeenCalledWith('user.created', event);
    });
  });

  describe('handleUserUpdated', () => {
    it('should log and store user.updated event', async () => {
      const event = new UserUpdatedEvent(
        { id: 'u1', email: 'user@test.com', userType: 'tenant' },
        { email: { old: 'old@test.com', new: 'user@test.com' } },
      );

      await service.handleUserUpdated(event);

      expect(mockEventStore.store).toHaveBeenCalledWith('user.updated', event);
    });
  });

  describe('handleUserDeactivated', () => {
    it('should log and store user.deactivated event', async () => {
      const event = new UserDeactivatedEvent({
        id: 'u1',
        email: 'user@test.com',
        userType: 'tenant',
      });

      await service.handleUserDeactivated(event);

      expect(mockEventStore.store).toHaveBeenCalledWith('user.deactivated', event);
    });
  });

  describe('handleUserLoggedIn', () => {
    it('should log and store auth.login event', async () => {
      const event = new UserLoggedInEvent(
        { id: 'u1', email: 'user@test.com', userType: 'tenant' },
        '192.168.1.1',
      );

      await service.handleUserLoggedIn(event);

      expect(mockLogger.log).toHaveBeenCalledWith(
        'Domain event: auth.login',
        expect.objectContaining({ ipAddress: '192.168.1.1' }),
      );
      expect(mockEventStore.store).toHaveBeenCalledWith('auth.login', event);
    });
  });

  describe('handleUserLoggedOut', () => {
    it('should log and store auth.logout event', async () => {
      const event = new UserLoggedOutEvent({ id: 'u1', userType: 'tenant' });

      await service.handleUserLoggedOut(event);

      expect(mockEventStore.store).toHaveBeenCalledWith('auth.logout', event);
    });
  });

  describe('handleEntityCreated', () => {
    it('should log and store entity.created event', async () => {
      const event = new EntityCreatedEvent('role', 'role-1', { name: 'Admin' });

      await service.handleEntityCreated(event);

      expect(mockLogger.log).toHaveBeenCalledWith(
        'Domain event: entity.created',
        expect.objectContaining({ entity: 'role', entityId: 'role-1' }),
      );
      expect(mockEventStore.store).toHaveBeenCalledWith('entity.created', event);
    });
  });

  describe('handleEntityUpdated', () => {
    it('should log and store entity.updated event', async () => {
      const event = new EntityUpdatedEvent('role', 'role-1', {
        name: { old: 'Admin', new: 'Super Admin' },
      });

      await service.handleEntityUpdated(event);

      expect(mockEventStore.store).toHaveBeenCalledWith('entity.updated', event);
    });
  });

  describe('handleEntityDeleted', () => {
    it('should log and store entity.deleted event', async () => {
      const event = new EntityDeletedEvent('role', 'role-1');

      await service.handleEntityDeleted(event);

      expect(mockEventStore.store).toHaveBeenCalledWith('entity.deleted', event);
    });
  });

  describe('handleSubscriptionChanged', () => {
    it('should log and store subscription.changed event', async () => {
      const event = new SubscriptionChangedEvent({
        tenantId: 't1',
        oldPlanId: 'p1',
        newPlanId: 'p2',
        status: 'ACTIVE',
      });

      await service.handleSubscriptionChanged(event);

      expect(mockLogger.log).toHaveBeenCalledWith(
        'Domain event: subscription.changed',
        expect.objectContaining({ newPlanId: 'p2' }),
      );
      expect(mockEventStore.store).toHaveBeenCalledWith('subscription.changed', event);
    });
  });

  describe('handleRoleAssigned', () => {
    it('should log and store role.assigned event', async () => {
      const event = new RoleAssignedEvent({
        userId: 'u1',
        roleId: 'r1',
        roleName: 'Admin',
        tenantId: 't1',
      });

      await service.handleRoleAssigned(event);

      expect(mockEventStore.store).toHaveBeenCalledWith('role.assigned', event);
    });
  });

  describe('handleRoleRevoked', () => {
    it('should log and store role.revoked event', async () => {
      const event = new RoleRevokedEvent({
        userId: 'u1',
        roleId: 'r1',
        roleName: 'Admin',
        tenantId: 't1',
      });

      await service.handleRoleRevoked(event);

      expect(mockEventStore.store).toHaveBeenCalledWith('role.revoked', event);
    });
  });

  describe('event emitter integration', () => {
    it('should register listeners for all domain events', () => {
      const expectedEvents = [
        TenantCreatedEvent.event,
        TenantUpdatedEvent.event,
        TenantSuspendedEvent.event,
        UserCreatedEvent.event,
        UserUpdatedEvent.event,
        UserDeactivatedEvent.event,
        UserLoggedInEvent.event,
        UserLoggedOutEvent.event,
        EntityCreatedEvent.event,
        EntityUpdatedEvent.event,
        EntityDeletedEvent.event,
        SubscriptionChangedEvent.event,
        RoleAssignedEvent.event,
        RoleRevokedEvent.event,
      ];

      for (const eventName of expectedEvents) {
        const listeners = eventEmitter.listeners(eventName);
        expect(listeners.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('should allow multiple handlers to listen to the same event', () => {
      let customHandlerCalled = false;

      eventEmitter.on(TenantCreatedEvent.event, () => {
        customHandlerCalled = true;
      });

      const event = new TenantCreatedEvent({ id: 't2', name: 'Beta', slug: 'beta' });
      eventEmitter.emit(TenantCreatedEvent.event, event);

      // The synchronous handler we registered should fire
      expect(customHandlerCalled).toBe(true);

      // The total listeners should be at least 2 (our handler + the @OnEvent handler)
      const listeners = eventEmitter.listeners(TenantCreatedEvent.event);
      expect(listeners.length).toBeGreaterThanOrEqual(2);
    });

    it('should not block the caller when handlers are async', () => {
      mockEventStore.store.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(ServiceResult.ok({ id: 'e1' })), 100)),
      );

      const event = new TenantCreatedEvent({ id: 't3', name: 'Gamma', slug: 'gamma' });

      // emit() returns synchronously — async handlers don't block
      const start = Date.now();
      eventEmitter.emit(TenantCreatedEvent.event, event);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(50);
    });
  });
});
