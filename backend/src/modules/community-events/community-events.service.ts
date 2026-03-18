import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ServiceResult } from '../../common/types';
import { PaginatedResult, paginate } from '../../common/dto/pagination.dto';
import { ErrorCodes } from '../../common/constants/error-codes';
import { CreateCommunityEventDto, UpdateCommunityEventDto, CreateRsvpDto } from './dto';

@Injectable()
export class CommunityEventsService {
  private readonly logger = new Logger(CommunityEventsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // === Provider CRUD ===

  async listProviderEvents(
    tenantId: string,
    page: number,
    pageSize: number,
  ): Promise<ServiceResult<PaginatedResult<unknown>>> {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { tenantId },
    });

    if (!profile) {
      return ServiceResult.ok(paginate([], 0, { page, pageSize }));
    }

    const where = { providerProfileId: profile.id };

    const [items, totalCount] = await Promise.all([
      this.prisma.communityEvent.findMany({
        where,
        include: { _count: { select: { rsvps: true } } },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { date: 'desc' },
      }),
      this.prisma.communityEvent.count({ where }),
    ]);

    return ServiceResult.ok(paginate(items, totalCount, { page, pageSize }));
  }

  async createEvent(
    tenantId: string,
    dto: CreateCommunityEventDto,
  ): Promise<ServiceResult<unknown>> {
    let profile = await this.prisma.providerProfile.findUnique({
      where: { tenantId },
    });

    if (!profile) {
      profile = await this.prisma.providerProfile.create({
        data: { tenantId },
      });
    }

    const event = await this.prisma.communityEvent.create({
      data: {
        providerProfileId: profile.id,
        title: dto.title,
        description: dto.description,
        date: new Date(dto.date),
        time: dto.time,
        location: dto.location,
        city: dto.city || profile.city,
        country: dto.country || profile.country,
        imageUrl: dto.imageUrl,
        maxAttendees: dto.maxAttendees,
        eventType: dto.eventType,
      },
    });

    return ServiceResult.ok(event);
  }

  async updateEvent(
    tenantId: string,
    eventId: string,
    dto: UpdateCommunityEventDto,
  ): Promise<ServiceResult<unknown>> {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { tenantId },
    });

    if (!profile) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Provider profile not found');
    }

    const event = await this.prisma.communityEvent.findFirst({
      where: { id: eventId, providerProfileId: profile.id },
    });

    if (!event) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Event not found');
    }

    const updated = await this.prisma.communityEvent.update({
      where: { id: eventId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.date !== undefined && { date: new Date(dto.date) }),
        ...(dto.time !== undefined && { time: dto.time }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.country !== undefined && { country: dto.country }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
        ...(dto.maxAttendees !== undefined && { maxAttendees: dto.maxAttendees }),
        ...(dto.eventType !== undefined && { eventType: dto.eventType }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    return ServiceResult.ok(updated);
  }

  async deleteEvent(
    tenantId: string,
    eventId: string,
  ): Promise<ServiceResult<unknown>> {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { tenantId },
    });

    if (!profile) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Provider profile not found');
    }

    const event = await this.prisma.communityEvent.findFirst({
      where: { id: eventId, providerProfileId: profile.id },
    });

    if (!event) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Event not found');
    }

    await this.prisma.communityEvent.delete({
      where: { id: eventId },
    });

    return ServiceResult.ok({ deleted: true });
  }

  // === Public Endpoints ===

  async listPublicEvents(filters: {
    country?: string;
    city?: string;
    category?: string;
    eventType?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ServiceResult<PaginatedResult<unknown>>> {
    const page = filters.page ?? 1;
    const pageSize = Math.min(filters.pageSize ?? 20, 100);

    const now = new Date();
    const where: Prisma.CommunityEventWhereInput = {
      isActive: true,
      date: { gte: now },
    };

    if (filters.eventType) {
      where.eventType = filters.eventType;
    }
    if (filters.country) {
      where.country = { equals: filters.country, mode: 'insensitive' };
    }
    if (filters.city) {
      where.city = { equals: filters.city, mode: 'insensitive' };
    }

    if (filters.category) {
      const slugs = filters.category.split(',').map((s) => s.trim()).filter(Boolean);
      const categories = await this.prisma.category.findMany({
        where: { slug: { in: slugs }, isActive: true },
        include: { children: { where: { isActive: true }, select: { id: true } } },
      });
      const categoryIds: string[] = [];
      for (const cat of categories) {
        categoryIds.push(cat.id);
        if (cat.children.length > 0) {
          categoryIds.push(...cat.children.map((c) => c.id));
        }
      }
      if (categoryIds.length > 0) {
        where.providerProfile = {
          categories: {
            some: { categoryId: { in: categoryIds } },
          },
        };
      }
    }

    const [items, totalCount] = await Promise.all([
      this.prisma.communityEvent.findMany({
        where,
        include: {
          _count: { select: { rsvps: true } },
          providerProfile: {
            select: {
              id: true,
              city: true,
              country: true,
              coverImageUrl: true,
              isVerified: true,
              tenant: { select: { id: true, name: true, slug: true } },
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { date: 'asc' },
      }),
      this.prisma.communityEvent.count({ where }),
    ]);

    const mapped = items.map((event: any) => ({
      id: event.id,
      title: event.title,
      description: event.description || '',
      date: event.date,
      time: event.time,
      location: event.location,
      city: event.city,
      country: event.country,
      imageUrl: event.imageUrl,
      maxAttendees: event.maxAttendees,
      eventType: event.eventType,
      rsvpCount: event._count.rsvps,
      createdAt: event.createdAt,
      provider: {
        id: event.providerProfile.id,
        name: event.providerProfile.tenant?.name || 'Unnamed',
        slug: event.providerProfile.tenant?.slug || event.providerProfile.id,
        city: event.providerProfile.city || '',
        country: event.providerProfile.country || '',
        coverPhoto: event.providerProfile.coverImageUrl,
        verified: event.providerProfile.isVerified || false,
      },
    }));

    return ServiceResult.ok(paginate(mapped, totalCount, { page, pageSize }));
  }

  async getUpcomingEvents(limit = 6): Promise<ServiceResult<unknown>> {
    const now = new Date();

    const events = await this.prisma.communityEvent.findMany({
      where: {
        isActive: true,
        date: { gte: now },
      },
      include: {
        _count: { select: { rsvps: true } },
        providerProfile: {
          select: {
            id: true,
            city: true,
            country: true,
            coverImageUrl: true,
            isVerified: true,
            tenant: { select: { id: true, name: true, slug: true } },
          },
        },
      },
      orderBy: { date: 'asc' },
      take: limit,
    });

    const mapped = events.map((event: any) => ({
      id: event.id,
      title: event.title,
      description: event.description || '',
      date: event.date,
      time: event.time,
      location: event.location,
      city: event.city,
      country: event.country,
      imageUrl: event.imageUrl,
      maxAttendees: event.maxAttendees,
      eventType: event.eventType,
      rsvpCount: event._count.rsvps,
      createdAt: event.createdAt,
      provider: {
        id: event.providerProfile.id,
        name: event.providerProfile.tenant?.name || 'Unnamed',
        slug: event.providerProfile.tenant?.slug || event.providerProfile.id,
        city: event.providerProfile.city || '',
        country: event.providerProfile.country || '',
        coverPhoto: event.providerProfile.coverImageUrl,
        verified: event.providerProfile.isVerified || false,
      },
    }));

    return ServiceResult.ok(mapped);
  }

  async getEventById(eventId: string): Promise<ServiceResult<unknown>> {
    const event = await this.prisma.communityEvent.findFirst({
      where: { id: eventId, isActive: true },
      include: {
        _count: { select: { rsvps: true } },
        providerProfile: {
          select: {
            id: true,
            city: true,
            country: true,
            coverImageUrl: true,
            isVerified: true,
            whatsapp: true,
            phone: true,
            email: true,
            tenant: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });

    if (!event) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Event not found');
    }

    const e = event as any;
    return ServiceResult.ok({
      id: e.id,
      title: e.title,
      description: e.description || '',
      date: e.date,
      time: e.time,
      location: e.location,
      city: e.city,
      country: e.country,
      imageUrl: e.imageUrl,
      maxAttendees: e.maxAttendees,
      eventType: e.eventType,
      rsvpCount: e._count.rsvps,
      createdAt: e.createdAt,
      provider: {
        id: e.providerProfile.id,
        name: e.providerProfile.tenant?.name || 'Unnamed',
        slug: e.providerProfile.tenant?.slug || e.providerProfile.id,
        city: e.providerProfile.city || '',
        country: e.providerProfile.country || '',
        coverPhoto: e.providerProfile.coverImageUrl,
        verified: e.providerProfile.isVerified || false,
        whatsapp: e.providerProfile.whatsapp || '',
        phone: e.providerProfile.phone || '',
        email: e.providerProfile.email || '',
      },
    });
  }

  async getProviderEvents(providerId: string, page: number, pageSize: number): Promise<ServiceResult<PaginatedResult<unknown>>> {
    const now = new Date();
    const where: Prisma.CommunityEventWhereInput = {
      providerProfileId: providerId,
      isActive: true,
      date: { gte: now },
    };

    const [items, totalCount] = await Promise.all([
      this.prisma.communityEvent.findMany({
        where,
        include: { _count: { select: { rsvps: true } } },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { date: 'asc' },
      }),
      this.prisma.communityEvent.count({ where }),
    ]);

    return ServiceResult.ok(paginate(items, totalCount, { page, pageSize }));
  }

  // === RSVP ===

  async rsvpToEvent(
    eventId: string,
    userId: string,
    dto: CreateRsvpDto,
  ): Promise<ServiceResult<unknown>> {
    const event = await this.prisma.communityEvent.findFirst({
      where: { id: eventId, isActive: true },
      include: { _count: { select: { rsvps: true } } },
    });

    if (!event) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Event not found');
    }

    if (event.maxAttendees && dto.status === 'going') {
      const goingCount = await this.prisma.eventRsvp.count({
        where: { eventId, status: 'going' },
      });
      if (goingCount >= event.maxAttendees) {
        return ServiceResult.fail(ErrorCodes.PLAN_LIMIT_REACHED, 'Event is at full capacity');
      }
    }

    const rsvp = await this.prisma.eventRsvp.upsert({
      where: { eventId_userId: { eventId, userId } },
      create: {
        eventId,
        userId,
        status: dto.status,
      },
      update: {
        status: dto.status,
      },
    });

    return ServiceResult.ok(rsvp);
  }

  async getUserRsvp(eventId: string, userId: string): Promise<ServiceResult<unknown>> {
    const rsvp = await this.prisma.eventRsvp.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });

    return ServiceResult.ok(rsvp);
  }

  async removeRsvp(eventId: string, userId: string): Promise<ServiceResult<unknown>> {
    const rsvp = await this.prisma.eventRsvp.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });

    if (!rsvp) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'RSVP not found');
    }

    await this.prisma.eventRsvp.delete({
      where: { eventId_userId: { eventId, userId } },
    });

    return ServiceResult.ok({ deleted: true });
  }
}
