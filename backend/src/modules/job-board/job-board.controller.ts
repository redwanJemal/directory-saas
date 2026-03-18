import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { JobBoardService } from './job-board.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreateJobPostingSchema,
  CreateJobPostingDto,
  UpdateJobPostingSchema,
  UpdateJobPostingDto,
  CreateJobApplicationSchema,
  CreateJobApplicationDto,
} from './dto';

// === Provider Job Postings CRUD ===

@Controller('providers/me/jobs')
@UseGuards(JwtAuthGuard)
export class ProviderJobsController {
  constructor(private readonly jobBoardService: JobBoardService) {}

  @Get()
  async list(
    @CurrentTenant() tenantId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize || '20', 10) || 20));

    const result = await this.jobBoardService.listProviderJobs(tenantId, pageNum, pageSizeNum);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentTenant() tenantId: string,
    @Body(new ZodValidationPipe(CreateJobPostingSchema)) dto: CreateJobPostingDto,
  ) {
    const result = await this.jobBoardService.createJobPosting(tenantId, dto);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Patch(':id')
  async update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateJobPostingSchema)) dto: UpdateJobPostingDto,
  ) {
    const result = await this.jobBoardService.updateJobPosting(tenantId, id, dto);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Delete(':id')
  async delete(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    const result = await this.jobBoardService.deleteJobPosting(tenantId, id);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Get(':id/applications')
  async listApplications(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize || '20', 10) || 20));

    const result = await this.jobBoardService.listJobApplications(tenantId, id, pageNum, pageSizeNum);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }
}

// === Public Job Board ===

@Controller('jobs')
export class PublicJobsController {
  constructor(private readonly jobBoardService: JobBoardService) {}

  @Get()
  @Public()
  async listActiveJobs(
    @Query('country') country?: string,
    @Query('city') city?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const result = await this.jobBoardService.listActiveJobs({
      country,
      city,
      type,
      search,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Get('latest')
  @Public()
  async getLatestJobs() {
    const result = await this.jobBoardService.getLatestJobs();
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Get('provider/:providerProfileId')
  @Public()
  async getProviderJobs(@Param('providerProfileId') providerProfileId: string) {
    const result = await this.jobBoardService.getProviderJobs(providerProfileId);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Get(':id')
  @Public()
  async getJobById(@Param('id') id: string) {
    const result = await this.jobBoardService.getJobById(id);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Post(':id/apply')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  async applyToJob(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(CreateJobApplicationSchema)) dto: CreateJobApplicationDto,
  ) {
    const result = await this.jobBoardService.applyToJob(id, dto);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }
}
