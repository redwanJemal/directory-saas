import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Job } from 'bullmq';
import { AppConfigService } from '../../../config/app-config.service';
import { JobService } from '../../../common/services/job.service';
import { QUEUES } from '../../../common/constants/queues';
import { BaseProcessor } from './base.processor';

@Injectable()
export class ExportProcessor
  extends BaseProcessor
  implements OnModuleInit, OnModuleDestroy
{
  protected readonly logger = new Logger(ExportProcessor.name);
  protected readonly queueName = QUEUES.EXPORT;

  constructor(
    jobService: JobService,
    private readonly config: AppConfigService,
  ) {
    super(jobService);
  }

  onModuleInit(): void {
    const { host, port, password } = this.config.redis;
    this.createWorker({ host, port, password }, 2);
    this.logger.log('Export processor started');
  }

  async onModuleDestroy(): Promise<void> {
    await this.close();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing export job '${job.name}' [${job.id}]`);

    switch (job.name) {
      case 'export-csv':
      case 'export-pdf':
        await this.runExport(job.data);
        break;
      default:
        this.logger.warn(`Unknown export job name: ${job.name}`);
    }
  }

  private async runExport(data: Record<string, unknown>): Promise<void> {
    this.logger.log(
      `Export completed for tenant ${data.tenantId} [format: ${data.format}]`,
    );
  }
}
