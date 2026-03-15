import { SearchIndexSyncService } from './search-index-sync.service';
import { JobService } from '../../common/services/job.service';
import { QUEUES } from '../../common/constants/queues';
import {
  EntityCreatedEvent,
  EntityUpdatedEvent,
  EntityDeletedEvent,
} from '../../common/types/events';

jest.mock('../../common/services/request-context', () => ({
  RequestContext: {
    traceId: 'trace-123',
    tenantId: 'tenant-1',
    userId: 'user-1',
  },
}));

describe('SearchIndexSyncService', () => {
  let service: SearchIndexSyncService;
  let mockJobService: { add: jest.Mock };

  beforeEach(() => {
    mockJobService = {
      add: jest.fn().mockResolvedValue({ id: 'job-1' }),
    };

    service = new SearchIndexSyncService(
      mockJobService as unknown as JobService,
    );
  });

  describe('onEntityCreated', () => {
    it('should queue an index-entity job', async () => {
      const event = new EntityCreatedEvent('provider', 'entity-1', {
        name: 'Test Provider',
      });

      await service.onEntityCreated(event);

      expect(mockJobService.add).toHaveBeenCalledWith(
        QUEUES.INDEXING,
        'index-entity',
        {
          action: 'index',
          entityType: 'provider',
          entityId: 'entity-1',
          tenantId: event.tenantId,
          data: { name: 'Test Provider' },
        },
      );
    });
  });

  describe('onEntityUpdated', () => {
    it('should queue an index-entity job for updates', async () => {
      const event = new EntityUpdatedEvent('provider', 'entity-1', {
        name: { old: 'Old Name', new: 'New Name' },
      });

      await service.onEntityUpdated(event);

      expect(mockJobService.add).toHaveBeenCalledWith(
        QUEUES.INDEXING,
        'index-entity',
        {
          action: 'update',
          entityType: 'provider',
          entityId: 'entity-1',
          tenantId: event.tenantId,
          changes: { name: { old: 'Old Name', new: 'New Name' } },
        },
      );
    });
  });

  describe('onEntityDeleted', () => {
    it('should queue a remove-from-index job', async () => {
      const event = new EntityDeletedEvent('provider', 'entity-1');

      await service.onEntityDeleted(event);

      expect(mockJobService.add).toHaveBeenCalledWith(
        QUEUES.INDEXING,
        'remove-from-index',
        {
          action: 'remove',
          entityType: 'provider',
          entityId: 'entity-1',
          tenantId: event.tenantId,
        },
      );
    });
  });
});
