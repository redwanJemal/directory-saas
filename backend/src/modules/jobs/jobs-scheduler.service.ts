import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { JobService } from '../../common/services/job.service';
import { QUEUES } from '../../common/constants/queues';

@Injectable()
export class JobsSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(JobsSchedulerService.name);

  constructor(private readonly jobService: JobService) {}

  async onModuleInit(): Promise<void> {
    await this.registerScheduledJobs();
  }

  private async registerScheduledJobs(): Promise<void> {
    // Cleanup expired refresh tokens daily at 2 AM
    await this.jobService.addRecurring(
      QUEUES.CLEANUP,
      'cleanup-refresh-tokens',
      {},
      '0 2 * * *',
    );
    this.logger.log('Scheduled: cleanup-refresh-tokens (daily at 2 AM)');

    // Cleanup expired presigned URL metadata daily at 3 AM
    await this.jobService.addRecurring(
      QUEUES.CLEANUP,
      'cleanup-expired-uploads',
      {},
      '0 3 * * *',
    );
    this.logger.log('Scheduled: cleanup-expired-uploads (daily at 3 AM)');
  }
}
