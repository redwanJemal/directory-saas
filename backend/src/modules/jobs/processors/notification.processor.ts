import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Job } from 'bullmq';
import { AppConfigService } from '../../../config/app-config.service';
import { JobService } from '../../../common/services/job.service';
import { QUEUES } from '../../../common/constants/queues';
import { BaseProcessor } from './base.processor';

@Injectable()
export class NotificationProcessor
  extends BaseProcessor
  implements OnModuleInit, OnModuleDestroy
{
  protected readonly logger = new Logger(NotificationProcessor.name);
  protected readonly queueName = QUEUES.NOTIFICATION;

  constructor(
    jobService: JobService,
    private readonly config: AppConfigService,
  ) {
    super(jobService);
  }

  onModuleInit(): void {
    const { host, port, password } = this.config.redis;
    this.createWorker({ host, port, password }, 5);
    this.logger.log('Notification processor started');
  }

  async onModuleDestroy(): Promise<void> {
    await this.close();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing notification job '${job.name}' [${job.id}]`);

    switch (job.name) {
      case 'push-notification':
      case 'in-app-notification':
        await this.sendNotification(job.data);
        break;
      default:
        this.logger.warn(`Unknown notification job name: ${job.name}`);
    }
  }

  private async sendNotification(
    data: Record<string, unknown>,
  ): Promise<void> {
    this.logger.log(
      `Notification sent to user ${data.userId} [type: ${data.type}]`,
    );
  }
}
