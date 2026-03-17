import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Job } from 'bullmq';
import { AppConfigService } from '../../../config/app-config.service';
import { JobService } from '../../../common/services/job.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { QUEUES } from '../../../common/constants/queues';
import { BaseProcessor } from './base.processor';

@Injectable()
export class CleanupProcessor
  extends BaseProcessor
  implements OnModuleInit, OnModuleDestroy
{
  protected readonly logger = new Logger(CleanupProcessor.name);
  protected readonly queueName = QUEUES.CLEANUP;

  constructor(
    jobService: JobService,
    private readonly config: AppConfigService,
    private readonly prisma: PrismaService,
  ) {
    super(jobService);
  }

  onModuleInit(): void {
    const { host, port, password } = this.config.redis;
    this.createWorker({ host, port, password }, 1);
    this.logger.log('Cleanup processor started');
  }

  async onModuleDestroy(): Promise<void> {
    await this.close();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing cleanup job '${job.name}' [${job.id}]`);

    switch (job.name) {
      case 'cleanup-refresh-tokens':
        await this.cleanupRefreshTokens();
        break;
      case 'cleanup-expired-uploads':
        await this.cleanupExpiredUploads();
        break;
      case 'expire-deals':
        await this.expireDeals();
        break;
      default:
        this.logger.warn(`Unknown cleanup job name: ${job.name}`);
    }
  }

  private async cleanupRefreshTokens(): Promise<void> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    this.logger.log(`Cleaned up ${result.count} expired refresh tokens`);
  }

  private async cleanupExpiredUploads(): Promise<void> {
    // Placeholder: will clean up expired presigned URL metadata
    this.logger.log('Expired uploads cleanup completed');
  }

  private async expireDeals(): Promise<void> {
    const result = await this.prisma.deal.updateMany({
      where: {
        isActive: true,
        expiresAt: { lt: new Date() },
      },
      data: { isActive: false },
    });
    this.logger.log(`Expired ${result.count} deals`);
  }
}
