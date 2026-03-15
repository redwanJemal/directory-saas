import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { JobService } from '../../common/services/job.service';
import { QUEUES } from '../../common/constants/queues';
import {
  EntityCreatedEvent,
  EntityUpdatedEvent,
  EntityDeletedEvent,
} from '../../common/types/events';

@Injectable()
export class SearchIndexSyncService {
  private readonly logger = new Logger(SearchIndexSyncService.name);

  constructor(private readonly jobService: JobService) {}

  @OnEvent(EntityCreatedEvent.event, { async: true })
  async onEntityCreated(event: EntityCreatedEvent): Promise<void> {
    this.logger.log(
      `Entity created: ${event.entity}:${event.entityId} — queuing index job`,
    );

    await this.jobService.add(QUEUES.INDEXING, 'index-entity', {
      action: 'index',
      entityType: event.entity,
      entityId: event.entityId,
      tenantId: event.tenantId,
      data: event.data,
    });
  }

  @OnEvent(EntityUpdatedEvent.event, { async: true })
  async onEntityUpdated(event: EntityUpdatedEvent): Promise<void> {
    this.logger.log(
      `Entity updated: ${event.entity}:${event.entityId} — queuing index job`,
    );

    await this.jobService.add(QUEUES.INDEXING, 'index-entity', {
      action: 'update',
      entityType: event.entity,
      entityId: event.entityId,
      tenantId: event.tenantId,
      changes: event.changes,
    });
  }

  @OnEvent(EntityDeletedEvent.event, { async: true })
  async onEntityDeleted(event: EntityDeletedEvent): Promise<void> {
    this.logger.log(
      `Entity deleted: ${event.entity}:${event.entityId} — queuing removal job`,
    );

    await this.jobService.add(QUEUES.INDEXING, 'remove-from-index', {
      action: 'remove',
      entityType: event.entity,
      entityId: event.entityId,
      tenantId: event.tenantId,
    });
  }
}
