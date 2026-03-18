import { Module } from '@nestjs/common';
import { JobBoardService } from './job-board.service';
import { ProviderJobsController, PublicJobsController } from './job-board.controller';

@Module({
  controllers: [ProviderJobsController, PublicJobsController],
  providers: [JobBoardService],
  exports: [JobBoardService],
})
export class JobBoardModule {}
