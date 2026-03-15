import { Module, Global } from '@nestjs/common';
import { AppConfigModule } from '../../config/app-config.module';
import { JobService } from '../../common/services/job.service';
import { JobsDashboardController } from './jobs-dashboard.controller';
import { JobsSchedulerService } from './jobs-scheduler.service';
import {
  EmailProcessor,
  NotificationProcessor,
  ExportProcessor,
  CleanupProcessor,
  IndexingProcessor,
  AiProcessor,
} from './processors';

@Global()
@Module({
  imports: [AppConfigModule],
  controllers: [JobsDashboardController],
  providers: [
    JobService,
    JobsSchedulerService,
    EmailProcessor,
    NotificationProcessor,
    ExportProcessor,
    CleanupProcessor,
    IndexingProcessor,
    AiProcessor,
  ],
  exports: [JobService],
})
export class JobsModule {}
