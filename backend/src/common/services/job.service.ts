import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Queue, Job, JobsOptions } from 'bullmq';
import { AppConfigService } from '../../config/app-config.service';
import {
  QueueName,
  ALL_QUEUE_NAMES,
  DEAD_LETTER_QUEUE,
  DEFAULT_JOB_OPTIONS,
  QUEUE_JOB_OPTIONS,
} from '../constants/queues';

@Injectable()
export class JobService implements OnModuleDestroy {
  private readonly logger = new Logger(JobService.name);
  private readonly queues = new Map<string, Queue>();

  constructor(private readonly config: AppConfigService) {
    for (const name of ALL_QUEUE_NAMES) {
      this.registerQueue(name);
    }
    this.registerQueue(DEAD_LETTER_QUEUE);
  }

  private registerQueue(name: string): void {
    const { host, port, password } = this.config.redis;
    const queue = new Queue(name, {
      connection: { host, port, password: password || undefined },
      defaultJobOptions: DEFAULT_JOB_OPTIONS,
    });
    this.queues.set(name, queue);
  }

  getQueue(name: string): Queue | undefined {
    return this.queues.get(name);
  }

  getAllQueues(): Queue[] {
    return Array.from(this.queues.values());
  }

  async add<T extends Record<string, unknown>>(
    queueName: QueueName,
    jobName: string,
    data: T,
    opts?: JobsOptions,
  ): Promise<Job<T>> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    const queueOpts = QUEUE_JOB_OPTIONS[queueName];
    const mergedOpts: JobsOptions = {
      ...queueOpts,
      ...opts,
    };

    const job = await queue.add(jobName, data, mergedOpts);
    this.logger.log(`Job '${jobName}' added to queue '${queueName}' [${job.id}]`);
    return job;
  }

  async addDelayed<T extends Record<string, unknown>>(
    queueName: QueueName,
    jobName: string,
    data: T,
    delayMs: number,
  ): Promise<Job<T>> {
    return this.add(queueName, jobName, data, { delay: delayMs });
  }

  async addRecurring<T extends Record<string, unknown>>(
    queueName: QueueName,
    jobName: string,
    data: T,
    cron: string,
  ): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    await queue.upsertJobScheduler(
      `${jobName}-scheduler`,
      { pattern: cron },
      { name: jobName, data, opts: QUEUE_JOB_OPTIONS[queueName] },
    );
    this.logger.log(
      `Recurring job '${jobName}' scheduled on queue '${queueName}' [${cron}]`,
    );
  }

  async getJob(queueName: string, jobId: string): Promise<Job | null> {
    const queue = this.queues.get(queueName);
    if (!queue) return null;
    const job = await queue.getJob(jobId);
    return job ?? null;
  }

  async moveToDeadLetter(
    job: Job,
    error: Error,
  ): Promise<void> {
    const dlq = this.queues.get(DEAD_LETTER_QUEUE);
    if (!dlq) return;

    await dlq.add('dead-letter', {
      originalQueue: job.queueName,
      originalJobName: job.name,
      originalJobId: job.id,
      originalData: job.data,
      failedReason: error.message,
      attemptsMade: job.attemptsMade,
      failedAt: new Date().toISOString(),
    });

    this.logger.warn(
      `Job '${job.name}' [${job.id}] moved to dead-letter queue after ${job.attemptsMade} attempts: ${error.message}`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    const closePromises = Array.from(this.queues.values()).map((q) =>
      q.close().catch((err) =>
        this.logger.error(`Error closing queue ${q.name}: ${err.message}`),
      ),
    );
    await Promise.all(closePromises);
  }
}
