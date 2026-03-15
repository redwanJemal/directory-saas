import { Test, TestingModule } from '@nestjs/testing';
import { CleanupProcessor } from './cleanup.processor';
import { JobService } from '../../../common/services/job.service';
import { AppConfigService } from '../../../config/app-config.service';
import { PrismaService } from '../../../prisma/prisma.service';

jest.mock('bullmq', () => ({
  Worker: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
  })),
  Job: jest.fn(),
}));

describe('CleanupProcessor', () => {
  let processor: CleanupProcessor;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    jest.clearAllMocks();

    const mockPrisma = {
      refreshToken: {
        deleteMany: jest.fn().mockResolvedValue({ count: 5 }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CleanupProcessor,
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
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    processor = module.get<CleanupProcessor>(CleanupProcessor);
    prisma = module.get(PrismaService);
  });

  it('should clean up expired refresh tokens', async () => {
    const mockJob = {
      name: 'cleanup-refresh-tokens',
      id: 'job-1',
      data: {},
    };

    await processor.process(mockJob as any);

    expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
      where: { expiresAt: { lt: expect.any(Date) } },
    });
  });

  it('should handle cleanup-expired-uploads job', async () => {
    const mockJob = {
      name: 'cleanup-expired-uploads',
      id: 'job-2',
      data: {},
    };

    await expect(processor.process(mockJob as any)).resolves.not.toThrow();
  });

  it('should handle unknown job names gracefully', async () => {
    const mockJob = {
      name: 'unknown-cleanup',
      id: 'job-3',
      data: {},
    };

    await expect(processor.process(mockJob as any)).resolves.not.toThrow();
  });
});
