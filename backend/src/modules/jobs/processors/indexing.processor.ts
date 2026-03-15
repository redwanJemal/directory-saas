import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Job } from 'bullmq';
import { AppConfigService } from '../../../config/app-config.service';
import { JobService } from '../../../common/services/job.service';
import { SearchService } from '../../../common/services/search.service';
import { QUEUES } from '../../../common/constants/queues';
import { BaseProcessor } from './base.processor';

@Injectable()
export class IndexingProcessor
  extends BaseProcessor
  implements OnModuleInit, OnModuleDestroy
{
  protected readonly logger = new Logger(IndexingProcessor.name);
  protected readonly queueName = QUEUES.INDEXING;

  constructor(
    jobService: JobService,
    private readonly config: AppConfigService,
    private readonly searchService: SearchService,
  ) {
    super(jobService);
  }

  onModuleInit(): void {
    const { host, port, password } = this.config.redis;
    this.createWorker({ host, port, password }, 3);
    this.logger.log('Indexing processor started');
  }

  async onModuleDestroy(): Promise<void> {
    await this.close();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing indexing job '${job.name}' [${job.id}]`);

    switch (job.name) {
      case 'index-entity':
        await this.indexEntity(job.data);
        break;
      case 'reindex-tenant':
        await this.reindexTenant(job.data);
        break;
      case 'remove-from-index':
        await this.removeFromIndex(job.data);
        break;
      default:
        this.logger.warn(`Unknown indexing job name: ${job.name}`);
    }
  }

  private async indexEntity(data: Record<string, unknown>): Promise<void> {
    const { entityType, entityId, tenantId } = data as {
      entityType: string;
      entityId: string;
      tenantId: string;
      data?: Record<string, unknown>;
    };

    const docData = (data.data as Record<string, unknown>) ?? {};
    const document = { id: entityId, ...docData };

    await this.searchService.index(entityType, tenantId, [document]);

    this.logger.log(
      `Indexed entity ${entityType}:${entityId} for tenant ${tenantId}`,
    );
  }

  private async reindexTenant(data: Record<string, unknown>): Promise<void> {
    const { tenantId, entityType, documents } = data as {
      tenantId: string;
      entityType: string;
      documents: Record<string, unknown>[];
    };

    if (documents?.length) {
      await this.searchService.index(entityType, tenantId, documents);
    }

    this.logger.log(
      `Reindexed ${documents?.length ?? 0} ${entityType} documents for tenant ${tenantId}`,
    );
  }

  private async removeFromIndex(data: Record<string, unknown>): Promise<void> {
    const { entityType, entityId, tenantId } = data as {
      entityType: string;
      entityId: string;
      tenantId: string;
    };

    await this.searchService.remove(entityType, tenantId, [entityId]);

    this.logger.log(
      `Removed ${entityType}:${entityId} from index for tenant ${tenantId}`,
    );
  }
}
