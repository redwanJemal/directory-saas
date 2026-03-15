import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DomainEvent } from '../../common/types/events';
import { ServiceResult } from '../../common/types';
import { DomainEvent as DomainEventModel } from '@prisma/client';
import { AppLoggerService } from '../../common/services/logger.service';

@Injectable()
export class EventStoreService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  async store(
    eventType: string,
    event: DomainEvent,
  ): Promise<ServiceResult<DomainEventModel>> {
    try {
      const stored = await this.prisma.domainEvent.create({
        data: {
          type: eventType,
          tenantId: event.tenantId ?? null,
          userId: event.userId ?? null,
          payload: this.serializeEvent(event) as Prisma.InputJsonValue,
        },
      });
      return ServiceResult.ok(stored);
    } catch (error) {
      this.logger.error('Failed to store domain event', {
        eventType,
        error: error instanceof Error ? error.message : String(error),
      });
      return ServiceResult.fail(
        'INTERNAL_ERROR',
        'Failed to store domain event',
      );
    }
  }

  async findByType(
    eventType: string,
    options?: { limit?: number; offset?: number; tenantId?: string },
  ): Promise<ServiceResult<DomainEventModel[]>> {
    const where: Record<string, unknown> = { type: eventType };
    if (options?.tenantId) {
      where.tenantId = options.tenantId;
    }

    const events = await this.prisma.domainEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
    });

    return ServiceResult.ok(events);
  }

  async findByEntity(
    entity: string,
    entityId: string,
    options?: { limit?: number },
  ): Promise<ServiceResult<DomainEventModel[]>> {
    const events = await this.prisma.domainEvent.findMany({
      where: {
        type: { startsWith: `${entity}.` },
        payload: {
          path: ['entityId'],
          equals: entityId,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit ?? 50,
    });

    return ServiceResult.ok(events);
  }

  private serializeEvent(event: DomainEvent): Record<string, unknown> {
    return JSON.parse(JSON.stringify(event)) as Record<string, unknown>;
  }
}
