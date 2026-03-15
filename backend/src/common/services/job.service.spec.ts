import { Test, TestingModule } from '@nestjs/testing';
import { JobService } from './job.service';
import { AppConfigService } from '../../config/app-config.service';
import { QUEUES, QUEUE_JOB_OPTIONS, DEAD_LETTER_QUEUE } from '../constants/queues';

// Mock bullmq
const mockQueueAdd = jest.fn();
const mockQueueGetJob = jest.fn();
const mockQueueClose = jest.fn();
const mockQueueUpsertJobScheduler = jest.fn();

jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation((name: string) => ({
    name,
    add: mockQueueAdd,
    getJob: mockQueueGetJob,
    close: mockQueueClose,
    upsertJobScheduler: mockQueueUpsertJobScheduler,
  })),
  Job: jest.fn(),
}));

describe('JobService', () => {
  let service: JobService;

  const mockConfig = {
    redis: { host: 'localhost', port: 6379, password: undefined },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockQueueAdd.mockResolvedValue({ id: 'job-123', name: 'test-job' });
    mockQueueGetJob.mockResolvedValue({ id: 'job-123', name: 'test-job' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobService,
        { provide: AppConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<JobService>(JobService);
  });

  describe('constructor', () => {
    it('should register all queues plus dead-letter queue', () => {
      const { Queue } = require('bullmq');
      const allQueueNames = [...Object.values(QUEUES), DEAD_LETTER_QUEUE];
      expect(Queue).toHaveBeenCalledTimes(allQueueNames.length);
      for (const name of allQueueNames) {
        expect(Queue).toHaveBeenCalledWith(name, expect.objectContaining({
          connection: { host: 'localhost', port: 6379, password: undefined },
        }));
      }
    });
  });

  describe('getQueue', () => {
    it('should return queue by name', () => {
      const queue = service.getQueue(QUEUES.EMAIL);
      expect(queue).toBeDefined();
      expect(queue!.name).toBe(QUEUES.EMAIL);
    });

    it('should return undefined for unknown queue', () => {
      const queue = service.getQueue('nonexistent');
      expect(queue).toBeUndefined();
    });
  });

  describe('getAllQueues', () => {
    it('should return all registered queues', () => {
      const queues = service.getAllQueues();
      const expectedCount = Object.values(QUEUES).length + 1; // +1 for dead-letter
      expect(queues).toHaveLength(expectedCount);
    });
  });

  describe('add', () => {
    it('should add a job to the specified queue with correct data', async () => {
      const data = { to: 'test@example.com', template: 'welcome' };
      const job = await service.add(QUEUES.EMAIL, 'send-welcome', data);

      expect(mockQueueAdd).toHaveBeenCalledWith(
        'send-welcome',
        data,
        expect.objectContaining({
          attempts: QUEUE_JOB_OPTIONS[QUEUES.EMAIL].attempts,
          backoff: QUEUE_JOB_OPTIONS[QUEUES.EMAIL].backoff,
        }),
      );
      expect(job.id).toBe('job-123');
    });

    it('should merge custom options with queue defaults', async () => {
      const data = { key: 'value' };
      await service.add(QUEUES.EMAIL, 'test', data, { priority: 1 });

      expect(mockQueueAdd).toHaveBeenCalledWith(
        'test',
        data,
        expect.objectContaining({
          attempts: 5,
          priority: 1,
        }),
      );
    });

    it('should throw if queue not found', async () => {
      await expect(
        service.add('nonexistent' as any, 'test', {}),
      ).rejects.toThrow("Queue 'nonexistent' not found");
    });
  });

  describe('addDelayed', () => {
    it('should add a delayed job with correct delay', async () => {
      const data = { key: 'value' };
      await service.addDelayed(QUEUES.NOTIFICATION, 'delayed-task', data, 5000);

      expect(mockQueueAdd).toHaveBeenCalledWith(
        'delayed-task',
        data,
        expect.objectContaining({ delay: 5000 }),
      );
    });
  });

  describe('addRecurring', () => {
    it('should upsert a job scheduler with cron pattern', async () => {
      const data = {};
      await service.addRecurring(QUEUES.CLEANUP, 'cleanup-tokens', data, '0 2 * * *');

      expect(mockQueueUpsertJobScheduler).toHaveBeenCalledWith(
        'cleanup-tokens-scheduler',
        { pattern: '0 2 * * *' },
        expect.objectContaining({
          name: 'cleanup-tokens',
          data: {},
        }),
      );
    });

    it('should throw if queue not found', async () => {
      await expect(
        service.addRecurring('nonexistent' as any, 'test', {}, '* * * * *'),
      ).rejects.toThrow("Queue 'nonexistent' not found");
    });
  });

  describe('getJob', () => {
    it('should return job by id', async () => {
      const job = await service.getJob(QUEUES.EMAIL, 'job-123');
      expect(job).toBeDefined();
      expect(mockQueueGetJob).toHaveBeenCalledWith('job-123');
    });

    it('should return null for unknown queue', async () => {
      const job = await service.getJob('nonexistent', 'job-123');
      expect(job).toBeNull();
    });

    it('should return null when job not found', async () => {
      mockQueueGetJob.mockResolvedValue(undefined);
      const job = await service.getJob(QUEUES.EMAIL, 'unknown');
      expect(job).toBeNull();
    });
  });

  describe('moveToDeadLetter', () => {
    it('should add job data to dead-letter queue', async () => {
      const mockJob = {
        id: 'job-456',
        name: 'failed-job',
        queueName: QUEUES.EMAIL,
        data: { to: 'test@example.com' },
        attemptsMade: 5,
      };
      const error = new Error('SMTP connection failed');

      await service.moveToDeadLetter(mockJob as any, error);

      expect(mockQueueAdd).toHaveBeenCalledWith(
        'dead-letter',
        expect.objectContaining({
          originalQueue: QUEUES.EMAIL,
          originalJobName: 'failed-job',
          originalJobId: 'job-456',
          originalData: { to: 'test@example.com' },
          failedReason: 'SMTP connection failed',
          attemptsMade: 5,
        }),
      );
    });
  });

  describe('onModuleDestroy', () => {
    it('should close all queues', async () => {
      mockQueueClose.mockResolvedValue(undefined);
      await service.onModuleDestroy();

      const expectedCount = Object.values(QUEUES).length + 1;
      expect(mockQueueClose).toHaveBeenCalledTimes(expectedCount);
    });
  });
});
