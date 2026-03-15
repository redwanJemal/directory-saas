import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Job } from 'bullmq';
import { AppConfigService } from '../../../config/app-config.service';
import { JobService } from '../../../common/services/job.service';
import { QUEUES } from '../../../common/constants/queues';
import { BaseProcessor } from './base.processor';

@Injectable()
export class AiProcessor
  extends BaseProcessor
  implements OnModuleInit, OnModuleDestroy
{
  protected readonly logger = new Logger(AiProcessor.name);
  protected readonly queueName = QUEUES.AI;

  constructor(
    jobService: JobService,
    private readonly config: AppConfigService,
  ) {
    super(jobService);
  }

  onModuleInit(): void {
    const { host, port, password } = this.config.redis;
    this.createWorker({ host, port, password }, 2);
    this.logger.log('AI processor started');
  }

  async onModuleDestroy(): Promise<void> {
    await this.close();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing AI job '${job.name}' [${job.id}]`);

    switch (job.name) {
      case 'generate-embedding':
      case 'generate-description':
      case 'classify-content':
        await this.processAiTask(job.data);
        break;
      default:
        this.logger.warn(`Unknown AI job name: ${job.name}`);
    }
  }

  private async processAiTask(data: Record<string, unknown>): Promise<void> {
    // Placeholder: actual AI processing will be implemented in Task 23
    this.logger.log(
      `AI task completed for tenant ${data.tenantId} [task: ${data.task}]`,
    );
  }
}
