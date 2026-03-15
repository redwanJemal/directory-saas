import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { BaseProcessor } from './base.processor';
import { JobService } from '../../../common/services/job.service';

// Mock bullmq Worker
const mockWorkerOn = jest.fn();
const mockWorkerClose = jest.fn();

jest.mock('bullmq', () => ({
  Worker: jest.fn().mockImplementation((_name, _processor, _opts) => ({
    on: mockWorkerOn,
    close: mockWorkerClose,
  })),
  Job: jest.fn(),
}));

class TestProcessor extends BaseProcessor {
  protected readonly logger = new Logger('TestProcessor');
  protected readonly queueName = 'test-queue';

  async process(job: Job): Promise<void> {
    // test implementation
  }

  // Expose protected method for testing
  public testCreateWorker(
    connection: { host: string; port: number; password?: string },
    concurrency?: number,
  ) {
    return this.createWorker(connection, concurrency);
  }
}

describe('BaseProcessor', () => {
  let processor: TestProcessor;
  let mockJobService: jest.Mocked<JobService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockJobService = {
      moveToDeadLetter: jest.fn().mockResolvedValue(undefined),
    } as any;

    processor = new TestProcessor(mockJobService);
  });

  describe('createWorker', () => {
    it('should create a Worker with correct queue name and connection', () => {
      const { Worker } = require('bullmq');
      const connection = { host: 'localhost', port: 6379 };

      processor.testCreateWorker(connection, 3);

      expect(Worker).toHaveBeenCalledWith(
        'test-queue',
        expect.any(Function),
        { connection, concurrency: 3 },
      );
    });

    it('should register completed, failed, and error event handlers', () => {
      processor.testCreateWorker({ host: 'localhost', port: 6379 });

      expect(mockWorkerOn).toHaveBeenCalledWith('completed', expect.any(Function));
      expect(mockWorkerOn).toHaveBeenCalledWith('failed', expect.any(Function));
      expect(mockWorkerOn).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should move job to dead-letter queue on final failure', () => {
      processor.testCreateWorker({ host: 'localhost', port: 6379 });

      // Get the failed handler
      const failedCall = mockWorkerOn.mock.calls.find((c) => c[0] === 'failed');
      const failedHandler = failedCall![1];

      const mockJob = {
        id: 'job-1',
        name: 'test-job',
        attemptsMade: 3,
        opts: { attempts: 3 },
      };
      const error = new Error('permanent failure');

      failedHandler(mockJob, error);

      expect(mockJobService.moveToDeadLetter).toHaveBeenCalledWith(
        mockJob,
        error,
      );
    });

    it('should not move to dead-letter on non-final failure', () => {
      processor.testCreateWorker({ host: 'localhost', port: 6379 });

      const failedCall = mockWorkerOn.mock.calls.find((c) => c[0] === 'failed');
      const failedHandler = failedCall![1];

      const mockJob = {
        id: 'job-1',
        name: 'test-job',
        attemptsMade: 1,
        opts: { attempts: 3 },
      };

      failedHandler(mockJob, new Error('transient'));

      expect(mockJobService.moveToDeadLetter).not.toHaveBeenCalled();
    });

    it('should handle undefined job in failed event', () => {
      processor.testCreateWorker({ host: 'localhost', port: 6379 });

      const failedCall = mockWorkerOn.mock.calls.find((c) => c[0] === 'failed');
      const failedHandler = failedCall![1];

      // Should not throw
      failedHandler(undefined, new Error('no job'));
      expect(mockJobService.moveToDeadLetter).not.toHaveBeenCalled();
    });
  });

  describe('close', () => {
    it('should close the worker', async () => {
      mockWorkerClose.mockResolvedValue(undefined);
      processor.testCreateWorker({ host: 'localhost', port: 6379 });

      await processor.close();
      expect(mockWorkerClose).toHaveBeenCalled();
    });
  });
});
