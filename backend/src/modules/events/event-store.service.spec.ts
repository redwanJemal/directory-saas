import { Test, TestingModule } from '@nestjs/testing';
import { EventStoreService } from './event-store.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AppLoggerService } from '../../common/services/logger.service';
import { TenantCreatedEvent, UserCreatedEvent } from '../../common/types/events';

describe('EventStoreService', () => {
  let service: EventStoreService;
  let prisma: PrismaService;

  const mockPrisma = {
    domainEvent: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventStoreService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AppLoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<EventStoreService>(EventStoreService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('store', () => {
    it('should persist a domain event to the database', async () => {
      const event = new TenantCreatedEvent({ id: 'tenant-1', name: 'Test Tenant', slug: 'test-tenant' });
      const storedEvent = {
        id: 'event-1',
        type: 'tenant.created',
        tenantId: null,
        userId: null,
        payload: { tenant: event.tenant, timestamp: event.timestamp },
        createdAt: new Date(),
      };

      mockPrisma.domainEvent.create.mockResolvedValue(storedEvent);

      const result = await service.store(TenantCreatedEvent.event, event);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(storedEvent);
      expect(mockPrisma.domainEvent.create).toHaveBeenCalledWith({
        data: {
          type: 'tenant.created',
          tenantId: null,
          userId: null,
          payload: expect.objectContaining({
            timestamp: event.timestamp,
            tenant: event.tenant,
          }),
        },
      });
    });

    it('should include tenantId and userId when present in event', async () => {
      const event = new UserCreatedEvent({
        id: 'user-1',
        email: 'test@test.com',
        userType: 'tenant',
        tenantId: 'tenant-1',
      });
      // Manually set tenantId and userId since we're outside RequestContext
      (event as any).tenantId = 'tenant-1';
      (event as any).userId = 'user-admin';

      const storedEvent = {
        id: 'event-2',
        type: 'user.created',
        tenantId: 'tenant-1',
        userId: 'user-admin',
        payload: {},
        createdAt: new Date(),
      };

      mockPrisma.domainEvent.create.mockResolvedValue(storedEvent);

      const result = await service.store(UserCreatedEvent.event, event);

      expect(result.success).toBe(true);
      expect(mockPrisma.domainEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'user.created',
          tenantId: 'tenant-1',
          userId: 'user-admin',
        }),
      });
    });

    it('should return failure on database error', async () => {
      const event = new TenantCreatedEvent({ id: '1', name: 'T', slug: 't' });
      mockPrisma.domainEvent.create.mockRejectedValue(new Error('DB connection failed'));

      const result = await service.store(TenantCreatedEvent.event, event);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INTERNAL_ERROR');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to store domain event',
        expect.objectContaining({ eventType: 'tenant.created' }),
      );
    });
  });

  describe('findByType', () => {
    it('should query events by type with default pagination', async () => {
      const events = [
        { id: 'e1', type: 'tenant.created', payload: {}, createdAt: new Date() },
        { id: 'e2', type: 'tenant.created', payload: {}, createdAt: new Date() },
      ];
      mockPrisma.domainEvent.findMany.mockResolvedValue(events);

      const result = await service.findByType('tenant.created');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(mockPrisma.domainEvent.findMany).toHaveBeenCalledWith({
        where: { type: 'tenant.created' },
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0,
      });
    });

    it('should filter by tenantId when provided', async () => {
      mockPrisma.domainEvent.findMany.mockResolvedValue([]);

      await service.findByType('user.created', { tenantId: 'tenant-1', limit: 10 });

      expect(mockPrisma.domainEvent.findMany).toHaveBeenCalledWith({
        where: { type: 'user.created', tenantId: 'tenant-1' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 0,
      });
    });

    it('should respect limit and offset options', async () => {
      mockPrisma.domainEvent.findMany.mockResolvedValue([]);

      await service.findByType('entity.updated', { limit: 25, offset: 50 });

      expect(mockPrisma.domainEvent.findMany).toHaveBeenCalledWith({
        where: { type: 'entity.updated' },
        orderBy: { createdAt: 'desc' },
        take: 25,
        skip: 50,
      });
    });
  });

  describe('findByEntity', () => {
    it('should query events by entity type and ID', async () => {
      mockPrisma.domainEvent.findMany.mockResolvedValue([]);

      await service.findByEntity('tenant', 'tenant-1');

      expect(mockPrisma.domainEvent.findMany).toHaveBeenCalledWith({
        where: {
          type: { startsWith: 'tenant.' },
          payload: { path: ['entityId'], equals: 'tenant-1' },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });

    it('should respect limit option', async () => {
      mockPrisma.domainEvent.findMany.mockResolvedValue([]);

      await service.findByEntity('user', 'user-1', { limit: 10 });

      expect(mockPrisma.domainEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 }),
      );
    });
  });
});
