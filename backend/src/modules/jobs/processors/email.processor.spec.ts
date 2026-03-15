import { Test, TestingModule } from '@nestjs/testing';
import { EmailProcessor } from './email.processor';
import { JobService } from '../../../common/services/job.service';
import { AppConfigService } from '../../../config/app-config.service';

const mockWorkerOn = jest.fn();
const mockWorkerClose = jest.fn();

jest.mock('bullmq', () => ({
  Worker: jest.fn().mockImplementation(() => ({
    on: mockWorkerOn,
    close: mockWorkerClose,
  })),
  Job: jest.fn(),
}));

describe('EmailProcessor', () => {
  let processor: EmailProcessor;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailProcessor,
        {
          provide: JobService,
          useValue: { moveToDeadLetter: jest.fn() },
        },
        {
          provide: AppConfigService,
          useValue: {
            redis: { host: 'localhost', port: 6379, password: undefined },
          },
        },
      ],
    }).compile();

    processor = module.get<EmailProcessor>(EmailProcessor);
  });

  it('should create a worker on module init', () => {
    const { Worker } = require('bullmq');
    processor.onModuleInit();

    expect(Worker).toHaveBeenCalledWith(
      'email',
      expect.any(Function),
      expect.objectContaining({ concurrency: 3 }),
    );
  });

  it('should process send-welcome job', async () => {
    const mockJob = {
      name: 'send-welcome',
      id: 'job-1',
      data: { to: 'user@example.com', template: 'welcome' },
    };

    await expect(processor.process(mockJob as any)).resolves.not.toThrow();
  });

  it('should process send-password-reset job', async () => {
    const mockJob = {
      name: 'send-password-reset',
      id: 'job-2',
      data: { to: 'user@example.com', template: 'password-reset' },
    };

    await expect(processor.process(mockJob as any)).resolves.not.toThrow();
  });

  it('should handle unknown job names gracefully', async () => {
    const mockJob = {
      name: 'unknown-job',
      id: 'job-3',
      data: {},
    };

    await expect(processor.process(mockJob as any)).resolves.not.toThrow();
  });

  it('should close worker on module destroy', async () => {
    mockWorkerClose.mockResolvedValue(undefined);
    processor.onModuleInit();
    await processor.onModuleDestroy();
    expect(mockWorkerClose).toHaveBeenCalled();
  });
});
