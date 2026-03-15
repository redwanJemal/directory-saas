import { Logger } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { JobService } from '../../../common/services/job.service';

export abstract class BaseProcessor {
  protected abstract readonly logger: Logger;
  protected abstract readonly queueName: string;
  protected worker!: Worker;

  constructor(protected readonly jobService: JobService) {}

  protected createWorker(
    connection: { host: string; port: number; password?: string },
    concurrency = 5,
  ): Worker {
    this.worker = new Worker(
      this.queueName,
      async (job: Job) => this.process(job),
      {
        connection,
        concurrency,
      },
    );

    this.worker.on('completed', (job: Job) => {
      this.logger.log(`Job '${job.name}' [${job.id}] completed`);
    });

    this.worker.on('failed', (job: Job | undefined, error: Error) => {
      if (!job) return;
      const isLastAttempt = job.attemptsMade >= (job.opts?.attempts ?? 3);
      if (isLastAttempt) {
        this.logger.error(
          `Job '${job.name}' [${job.id}] permanently failed after ${job.attemptsMade} attempts: ${error.message}`,
        );
        this.jobService
          .moveToDeadLetter(job, error)
          .catch((err) =>
            this.logger.error(`Failed to move job to DLQ: ${err.message}`),
          );
      } else {
        this.logger.warn(
          `Job '${job.name}' [${job.id}] failed (attempt ${job.attemptsMade}): ${error.message}`,
        );
      }
    });

    this.worker.on('error', (error: Error) => {
      this.logger.error(`Worker error on '${this.queueName}': ${error.message}`);
    });

    return this.worker;
  }

  abstract process(job: Job): Promise<void>;

  async close(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
    }
  }
}
