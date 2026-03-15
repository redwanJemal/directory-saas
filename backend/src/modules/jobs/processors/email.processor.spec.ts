import { Test, TestingModule } from '@nestjs/testing';
import { EmailProcessor } from './email.processor';
import { JobService } from '../../../common/services/job.service';
import { AppConfigService } from '../../../config/app-config.service';
import { EmailService } from '../../../common/services/email.service';

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
  let emailServiceMock: Record<string, jest.Mock>;

  beforeEach(async () => {
    jest.clearAllMocks();

    emailServiceMock = {
      sendDirect: jest.fn().mockResolvedValue(undefined),
    };

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
        {
          provide: EmailService,
          useValue: emailServiceMock,
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

  it('should process email job by calling sendDirect', async () => {
    const mockJob = {
      name: 'send-welcome',
      id: 'job-1',
      data: {
        to: 'user@example.com',
        template: 'welcome',
        data: { firstName: 'John' },
      },
    };

    await processor.process(mockJob as any);

    expect(emailServiceMock.sendDirect).toHaveBeenCalledWith(
      'user@example.com',
      'welcome',
      { firstName: 'John' },
    );
  });

  it('should process send-password-reset job', async () => {
    const mockJob = {
      name: 'send-password-reset',
      id: 'job-2',
      data: {
        to: 'user@example.com',
        template: 'password-reset',
        data: { firstName: 'Bob', resetUrl: 'https://example.com/reset' },
      },
    };

    await processor.process(mockJob as any);

    expect(emailServiceMock.sendDirect).toHaveBeenCalledWith(
      'user@example.com',
      'password-reset',
      { firstName: 'Bob', resetUrl: 'https://example.com/reset' },
    );
  });

  it('should close worker on module destroy', async () => {
    mockWorkerClose.mockResolvedValue(undefined);
    processor.onModuleInit();
    await processor.onModuleDestroy();
    expect(mockWorkerClose).toHaveBeenCalled();
  });
});
