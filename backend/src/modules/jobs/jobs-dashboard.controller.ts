import {
  Controller,
  Get,
  UseGuards,
  Req,
  Res,
  All,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { JobService } from '../../common/services/job.service';

@ApiTags('Admin Queues')
@Controller('admin/queues')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class JobsDashboardController {
  private readonly serverAdapter: ExpressAdapter;

  constructor(private readonly jobService: JobService) {
    this.serverAdapter = new ExpressAdapter();
    this.serverAdapter.setBasePath('/api/v1/admin/queues');

    createBullBoard({
      queues: this.jobService
        .getAllQueues()
        .map((q) => new BullMQAdapter(q)),
      serverAdapter: this.serverAdapter,
    });
  }

  @All('*')
  handleAll(@Req() req: Request, @Res() res: Response): void {
    const handler = this.serverAdapter.getRouter();
    handler(req, res);
  }

  @Get()
  handleRoot(@Req() req: Request, @Res() res: Response): void {
    const handler = this.serverAdapter.getRouter();
    handler(req, res);
  }
}
