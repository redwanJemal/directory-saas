import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Job } from 'bullmq';
import { AppConfigService } from '../../../config/app-config.service';
import { JobService } from '../../../common/services/job.service';
import { QUEUES } from '../../../common/constants/queues';
import { BaseProcessor } from './base.processor';
import { PrismaService } from '../../../prisma/prisma.service';

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
    private readonly prisma: PrismaService,
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
      case 'in-app-notification':
        await this.createInAppNotification(job.data);
        break;
      case 'push-notification':
        this.logger.log(
          `Push notification stub: user ${job.data.userId} [type: ${job.data.type}]`,
        );
        break;
      default:
        this.logger.warn(`Unknown notification job name: ${job.name}`);
    }
  }

  private async createInAppNotification(
    data: Record<string, unknown>,
  ): Promise<void> {
    await this.prisma.notification.create({
      data: {
        tenantId: data.tenantId as string | undefined,
        userId: data.userId as string,
        userType: data.userType as string,
        type: data.type as string,
        title: data.title as string,
        message: data.message as string,
        data: (data.data as object) ?? undefined,
      },
    });
    this.logger.log(
      `In-app notification created for user ${data.userId} [type: ${data.type}]`,
    );
  }
}
