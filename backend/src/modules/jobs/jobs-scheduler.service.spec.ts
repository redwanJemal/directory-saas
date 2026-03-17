import { Test, TestingModule } from '@nestjs/testing';
import { JobsSchedulerService } from './jobs-scheduler.service';
import { JobService } from '../../common/services/job.service';
import { QUEUES } from '../../common/constants/queues';

describe('JobsSchedulerService', () => {
  let scheduler: JobsSchedulerService;
  let jobService: jest.Mocked<JobService>;

  beforeEach(async () => {
    const mockJobService = {
      addRecurring: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsSchedulerService,
        { provide: JobService, useValue: mockJobService },
      ],
    }).compile();

    scheduler = module.get<JobsSchedulerService>(JobsSchedulerService);
    jobService = module.get(JobService);
  });

  describe('onModuleInit', () => {
    it('should register cleanup-refresh-tokens recurring job', async () => {
      await scheduler.onModuleInit();

      expect(jobService.addRecurring).toHaveBeenCalledWith(
        QUEUES.CLEANUP,
        'cleanup-refresh-tokens',
        {},
        '0 2 * * *',
      );
    });

    it('should register cleanup-expired-uploads recurring job', async () => {
      await scheduler.onModuleInit();

      expect(jobService.addRecurring).toHaveBeenCalledWith(
        QUEUES.CLEANUP,
        'cleanup-expired-uploads',
        {},
        '0 3 * * *',
      );
    });

    it('should register expire-deals recurring job', async () => {
      await scheduler.onModuleInit();

      expect(jobService.addRecurring).toHaveBeenCalledWith(
        QUEUES.CLEANUP,
        'expire-deals',
        {},
        '0 0 * * *',
      );
    });

    it('should register exactly 3 scheduled jobs', async () => {
      await scheduler.onModuleInit();
      expect(jobService.addRecurring).toHaveBeenCalledTimes(3);
    });
  });
});
