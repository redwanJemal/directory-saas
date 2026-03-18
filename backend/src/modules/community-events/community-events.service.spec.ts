import { CommunityEventsService } from './community-events.service';

describe('CommunityEventsService', () => {
  let service: CommunityEventsService;
  let prisma: any;

  const tenantId = 'tenant-uuid-1';
  const profileId = 'profile-uuid-1';
  const eventId = 'event-uuid-1';
  const userId = 'user-uuid-1';

  const mockProfile = {
    id: profileId,
    tenantId,
    city: 'Dubai',
    country: 'AE',
  };

  const mockEvent = {
    id: eventId,
    providerProfileId: profileId,
    title: 'Community Meetup',
    description: 'Monthly Ethiopian community gathering',
    date: new Date('2026-06-15'),
    time: '18:00',
    location: 'Community Hall',
    city: 'Dubai',
    country: 'AE',
    imageUrl: null,
    maxAttendees: 100,
    eventType: 'community',
    isActive: true,
    _count: { rsvps: 5 },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRsvp = {
    id: 'rsvp-uuid-1',
    eventId,
    userId,
    status: 'going',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    prisma = {
      providerProfile: {
        findUnique: jest.fn().mockResolvedValue(mockProfile),
        create: jest.fn().mockResolvedValue(mockProfile),
      },
      communityEvent: {
        findMany: jest.fn().mockResolvedValue([mockEvent]),
        findFirst: jest.fn().mockResolvedValue(mockEvent),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockEvent),
        update: jest.fn().mockResolvedValue(mockEvent),
        delete: jest.fn().mockResolvedValue(mockEvent),
      },
      eventRsvp: {
        findUnique: jest.fn().mockResolvedValue(mockRsvp),
        count: jest.fn().mockResolvedValue(5),
        upsert: jest.fn().mockResolvedValue(mockRsvp),
        delete: jest.fn().mockResolvedValue(mockRsvp),
      },
      category: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    service = new CommunityEventsService(prisma);
  });

  // === Provider CRUD ===

  describe('listProviderEvents', () => {
    it('should return paginated events for provider', async () => {
      const result = await service.listProviderEvents(tenantId, 1, 20);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.items).toHaveLength(1);
      expect(result.data!.total).toBe(1);
      expect(prisma.communityEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { providerProfileId: profileId },
          skip: 0,
          take: 20,
        }),
      );
    });

    it('should return empty list when no profile exists', async () => {
      prisma.providerProfile.findUnique.mockResolvedValue(null);

      const result = await service.listProviderEvents(tenantId, 1, 20);

      expect(result.success).toBe(true);
      expect(result.data!.items).toHaveLength(0);
      expect(result.data!.total).toBe(0);
    });
  });

  describe('createEvent', () => {
    it('should create an event successfully', async () => {
      const dto = {
        title: 'New Event',
        description: 'Fun event',
        date: '2026-06-20',
        time: '19:00',
        location: 'Park',
        eventType: 'business' as const,
      };

      const result = await service.createEvent(tenantId, dto);

      expect(result.success).toBe(true);
      expect(prisma.communityEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          providerProfileId: profileId,
          title: 'New Event',
          description: 'Fun event',
          date: new Date('2026-06-20'),
          time: '19:00',
        }),
      });
    });

    it('should create profile if it does not exist', async () => {
      prisma.providerProfile.findUnique.mockResolvedValue(null);

      const dto = { title: 'New Event', date: '2026-06-20', eventType: 'business' as const };
      const result = await service.createEvent(tenantId, dto);

      expect(result.success).toBe(true);
      expect(prisma.providerProfile.create).toHaveBeenCalledWith({
        data: { tenantId },
      });
    });

    it('should use profile city/country as defaults', async () => {
      const dto = {
        title: 'Local Event',
        date: '2026-06-20',
        eventType: 'community' as const,
      };

      await service.createEvent(tenantId, dto);

      expect(prisma.communityEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          city: 'Dubai',
          country: 'AE',
        }),
      });
    });
  });

  describe('updateEvent', () => {
    it('should update an event successfully', async () => {
      const dto = { title: 'Updated Event' };

      const result = await service.updateEvent(tenantId, eventId, dto);

      expect(result.success).toBe(true);
      expect(prisma.communityEvent.update).toHaveBeenCalledWith({
        where: { id: eventId },
        data: expect.objectContaining({ title: 'Updated Event' }),
      });
    });

    it('should fail when profile not found', async () => {
      prisma.providerProfile.findUnique.mockResolvedValue(null);

      const result = await service.updateEvent(tenantId, eventId, { title: 'x' });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });

    it('should fail when event not found', async () => {
      prisma.communityEvent.findFirst.mockResolvedValue(null);

      const result = await service.updateEvent(tenantId, eventId, { title: 'x' });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });
  });

  describe('deleteEvent', () => {
    it('should delete an event', async () => {
      const result = await service.deleteEvent(tenantId, eventId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ deleted: true });
      expect(prisma.communityEvent.delete).toHaveBeenCalledWith({
        where: { id: eventId },
      });
    });

    it('should fail when profile not found', async () => {
      prisma.providerProfile.findUnique.mockResolvedValue(null);

      const result = await service.deleteEvent(tenantId, eventId);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });

    it('should fail when event not found', async () => {
      prisma.communityEvent.findFirst.mockResolvedValue(null);

      const result = await service.deleteEvent(tenantId, eventId);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });
  });

  // === Public Endpoints ===

  describe('listPublicEvents', () => {
    it('should return paginated upcoming events', async () => {
      prisma.communityEvent.findMany.mockResolvedValue([
        {
          ...mockEvent,
          providerProfile: {
            id: profileId,
            city: 'Dubai',
            country: 'AE',
            coverImageUrl: null,
            isVerified: true,
            tenant: { id: 't1', name: 'Test Biz', slug: 'test-biz' },
          },
        },
      ]);

      const result = await service.listPublicEvents({ page: 1, pageSize: 20 });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(prisma.communityEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
            date: { gte: expect.any(Date) },
          }),
        }),
      );
    });

    it('should filter by country', async () => {
      prisma.communityEvent.findMany.mockResolvedValue([]);
      prisma.communityEvent.count.mockResolvedValue(0);

      await service.listPublicEvents({ country: 'AE' });

      expect(prisma.communityEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            country: { equals: 'AE', mode: 'insensitive' },
          }),
        }),
      );
    });

    it('should filter by eventType', async () => {
      prisma.communityEvent.findMany.mockResolvedValue([]);
      prisma.communityEvent.count.mockResolvedValue(0);

      await service.listPublicEvents({ eventType: 'community' });

      expect(prisma.communityEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            eventType: 'community',
          }),
        }),
      );
    });

    it('should filter by category', async () => {
      prisma.category.findMany.mockResolvedValue([
        { id: 'cat-1', slug: 'food', children: [{ id: 'cat-2' }] },
      ]);
      prisma.communityEvent.findMany.mockResolvedValue([]);
      prisma.communityEvent.count.mockResolvedValue(0);

      await service.listPublicEvents({ category: 'food' });

      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { slug: { in: ['food'] }, isActive: true },
        }),
      );
    });
  });

  describe('getUpcomingEvents', () => {
    it('should return up to 6 upcoming events', async () => {
      prisma.communityEvent.findMany.mockResolvedValue([
        {
          ...mockEvent,
          providerProfile: {
            id: profileId,
            city: 'Dubai',
            country: 'AE',
            coverImageUrl: null,
            isVerified: false,
            tenant: { id: 't1', name: 'Test Biz', slug: 'test-biz' },
          },
        },
      ]);

      const result = await service.getUpcomingEvents();

      expect(result.success).toBe(true);
      expect(prisma.communityEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
          take: 6,
        }),
      );
    });
  });

  describe('getEventById', () => {
    it('should return an event with provider info', async () => {
      prisma.communityEvent.findFirst.mockResolvedValue({
        ...mockEvent,
        providerProfile: {
          id: profileId,
          city: 'Dubai',
          country: 'AE',
          coverImageUrl: null,
          isVerified: true,
          whatsapp: '+971501234567',
          phone: '+971501234567',
          email: 'test@example.com',
          tenant: { id: 't1', name: 'Test Biz', slug: 'test-biz' },
        },
      });

      const result = await service.getEventById(eventId);

      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.id).toBe(eventId);
      expect(data.provider.name).toBe('Test Biz');
    });

    it('should fail when event not found', async () => {
      prisma.communityEvent.findFirst.mockResolvedValue(null);

      const result = await service.getEventById('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });
  });

  // === RSVP ===

  describe('rsvpToEvent', () => {
    it('should create or update an RSVP', async () => {
      const result = await service.rsvpToEvent(eventId, userId, { status: 'going' });

      expect(result.success).toBe(true);
      expect(prisma.eventRsvp.upsert).toHaveBeenCalledWith({
        where: { eventId_userId: { eventId, userId } },
        create: { eventId, userId, status: 'going' },
        update: { status: 'going' },
      });
    });

    it('should fail when event not found', async () => {
      prisma.communityEvent.findFirst.mockResolvedValue(null);

      const result = await service.rsvpToEvent(eventId, userId, { status: 'going' });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });

    it('should fail when event is at full capacity', async () => {
      prisma.communityEvent.findFirst.mockResolvedValue({
        ...mockEvent,
        maxAttendees: 5,
      });
      prisma.eventRsvp.count.mockResolvedValue(5);

      const result = await service.rsvpToEvent(eventId, userId, { status: 'going' });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PLAN_LIMIT_REACHED');
    });

    it('should allow interested RSVP even when full', async () => {
      prisma.communityEvent.findFirst.mockResolvedValue({
        ...mockEvent,
        maxAttendees: 5,
      });
      prisma.eventRsvp.count.mockResolvedValue(5);

      const result = await service.rsvpToEvent(eventId, userId, { status: 'interested' });

      expect(result.success).toBe(true);
    });
  });

  describe('getUserRsvp', () => {
    it('should return user RSVP', async () => {
      const result = await service.getUserRsvp(eventId, userId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockRsvp);
    });

    it('should return null when no RSVP exists', async () => {
      prisma.eventRsvp.findUnique.mockResolvedValue(null);

      const result = await service.getUserRsvp(eventId, userId);

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe('removeRsvp', () => {
    it('should remove an RSVP', async () => {
      const result = await service.removeRsvp(eventId, userId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ deleted: true });
    });

    it('should fail when RSVP not found', async () => {
      prisma.eventRsvp.findUnique.mockResolvedValue(null);

      const result = await service.removeRsvp(eventId, userId);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });
  });

  // === DTO Validation ===

  describe('CreateCommunityEventSchema', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { CreateCommunityEventSchema } = require('./dto/create-community-event.dto');

    it('should accept valid event data', () => {
      const result = CreateCommunityEventSchema.safeParse({
        title: 'Community Meetup',
        description: 'Monthly gathering',
        date: '2026-06-15',
        time: '18:00',
        location: 'Community Hall',
        maxAttendees: 50,
        eventType: 'community',
      });
      expect(result.success).toBe(true);
    });

    it('should require title with min 3 chars', () => {
      const result = CreateCommunityEventSchema.safeParse({
        title: 'AB',
        date: '2026-06-15',
      });
      expect(result.success).toBe(false);
    });

    it('should require a valid date', () => {
      const result = CreateCommunityEventSchema.safeParse({
        title: 'Test Event',
        date: 'not-a-date',
      });
      expect(result.success).toBe(false);
    });

    it('should accept event with only title and date', () => {
      const result = CreateCommunityEventSchema.safeParse({
        title: 'Minimal Event',
        date: '2026-06-15',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid eventType', () => {
      const result = CreateCommunityEventSchema.safeParse({
        title: 'Test Event',
        date: '2026-06-15',
        eventType: 'invalid',
      });
      expect(result.success).toBe(false);
    });

    it('should default eventType to business', () => {
      const result = CreateCommunityEventSchema.safeParse({
        title: 'Test Event',
        date: '2026-06-15',
      });
      expect(result.success).toBe(true);
      expect(result.data.eventType).toBe('business');
    });
  });

  describe('CreateRsvpSchema', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { CreateRsvpSchema } = require('./dto/create-rsvp.dto');

    it('should accept valid RSVP statuses', () => {
      expect(CreateRsvpSchema.safeParse({ status: 'going' }).success).toBe(true);
      expect(CreateRsvpSchema.safeParse({ status: 'interested' }).success).toBe(true);
      expect(CreateRsvpSchema.safeParse({ status: 'not-going' }).success).toBe(true);
    });

    it('should reject invalid status', () => {
      const result = CreateRsvpSchema.safeParse({ status: 'maybe' });
      expect(result.success).toBe(false);
    });

    it('should default to going', () => {
      const result = CreateRsvpSchema.safeParse({});
      expect(result.success).toBe(true);
      expect(result.data.status).toBe('going');
    });
  });
});
