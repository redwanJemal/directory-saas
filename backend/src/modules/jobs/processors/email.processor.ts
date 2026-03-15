import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Job } from 'bullmq';
import { AppConfigService } from '../../../config/app-config.service';
import { JobService } from '../../../common/services/job.service';
import { QUEUES } from '../../../common/constants/queues';
import { BaseProcessor } from './base.processor';

@Injectable()
export class EmailProcessor
  extends BaseProcessor
  implements OnModuleInit, OnModuleDestroy
{
  protected readonly logger = new Logger(EmailProcessor.name);
  protected readonly queueName = QUEUES.EMAIL;

  constructor(
    jobService: JobService,
    private readonly config: AppConfigService,
  ) {
    super(jobService);
  }

  onModuleInit(): void {
    const { host, port, password } = this.config.redis;
    this.createWorker({ host, port, password }, 3);
    this.logger.log('Email processor started');
  }

  async onModuleDestroy(): Promise<void> {
    await this.close();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing email job '${job.name}' [${job.id}]`);

    switch (job.name) {
      case 'send-welcome':
      case 'send-password-reset':
      case 'send-verification':
      case 'send-notification':
        await this.sendEmail(job.data);
        break;
      default:
        this.logger.warn(`Unknown email job name: ${job.name}`);
    }
  }

  private async sendEmail(data: Record<string, unknown>): Promise<void> {
    // Placeholder: actual email sending logic will be implemented in Task 18
    this.logger.log(`Email sent to ${data.to} [template: ${data.template}]`);
  }
}
