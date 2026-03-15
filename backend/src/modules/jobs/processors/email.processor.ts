import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Job } from 'bullmq';
import { AppConfigService } from '../../../config/app-config.service';
import { JobService } from '../../../common/services/job.service';
import { EmailService } from '../../../common/services/email.service';
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
    private readonly emailService: EmailService,
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

    const { to, template, data } = job.data as {
      to: string;
      template: string;
      data: Record<string, string | number>;
    };

    await this.emailService.sendDirect(to, template, data);
  }
}
