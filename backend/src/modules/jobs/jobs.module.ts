import { Module, Global } from '@nestjs/common';
import { AppConfigModule } from '../../config/app-config.module';
import { JobService } from '../../common/services/job.service';
import { EmailService } from '../../common/services/email.service';
import { SearchService } from '../../common/services/search.service';
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
    EmailService,
    SearchService,
    JobsSchedulerService,
    EmailProcessor,
    NotificationProcessor,
    ExportProcessor,
    CleanupProcessor,
    IndexingProcessor,
    AiProcessor,
  ],
  exports: [JobService, EmailService, SearchService],
})
export class JobsModule {}
