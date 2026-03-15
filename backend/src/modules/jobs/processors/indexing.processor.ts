import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Job } from 'bullmq';
import { AppConfigService } from '../../../config/app-config.service';
import { JobService } from '../../../common/services/job.service';
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
      case 'reindex-tenant':
      case 'remove-from-index':
        await this.updateIndex(job.data);
        break;
      default:
        this.logger.warn(`Unknown indexing job name: ${job.name}`);
    }
  }

  private async updateIndex(data: Record<string, unknown>): Promise<void> {
    // Placeholder: actual search index logic will be implemented in Task 22
    this.logger.log(
      `Index updated for entity ${data.entityType}:${data.entityId}`,
    );
  }
}
