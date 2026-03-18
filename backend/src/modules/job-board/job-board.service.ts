import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ServiceResult } from '../../common/types';
import { PaginatedResult, paginate } from '../../common/dto/pagination.dto';
import { ErrorCodes } from '../../common/constants/error-codes';
import { CreateJobPostingDto, UpdateJobPostingDto, CreateJobApplicationDto } from './dto';

@Injectable()
export class JobBoardService {
  private readonly logger = new Logger(JobBoardService.name);

  constructor(private readonly prisma: PrismaService) {}

  // === Provider CRUD ===

  async listProviderJobs(
    tenantId: string,
    page: number,
    pageSize: number,
  ): Promise<ServiceResult<PaginatedResult<unknown>>> {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { tenantId },
    });

    if (!profile) {
      return ServiceResult.ok(paginate([], 0, { page, pageSize }));
    }

    const where = { providerProfileId: profile.id };

    const [items, totalCount] = await Promise.all([
      this.prisma.jobPosting.findMany({
        where,
        include: { _count: { select: { applications: true } } },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.jobPosting.count({ where }),
    ]);

    const mapped = items.map((job) => ({
      ...job,
      salaryMin: job.salaryMin ? Number(job.salaryMin) : null,
      salaryMax: job.salaryMax ? Number(job.salaryMax) : null,
      applicationCount: job._count.applications,
    }));

    return ServiceResult.ok(paginate(mapped, totalCount, { page, pageSize }));
  }

  async createJobPosting(
    tenantId: string,
    dto: CreateJobPostingDto,
  ): Promise<ServiceResult<unknown>> {
    let profile = await this.prisma.providerProfile.findUnique({
      where: { tenantId },
    });

    if (!profile) {
      profile = await this.prisma.providerProfile.create({
        data: { tenantId },
      });
    }

    const job = await this.prisma.jobPosting.create({
      data: {
        providerProfileId: profile.id,
        title: dto.title,
        description: dto.description,
        type: dto.type,
        salaryMin: dto.salaryMin,
        salaryMax: dto.salaryMax,
        salaryCurrency: dto.salaryCurrency,
        city: dto.city,
        country: dto.country,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
    });

    return ServiceResult.ok(job);
  }

  async updateJobPosting(
    tenantId: string,
    jobId: string,
    dto: UpdateJobPostingDto,
  ): Promise<ServiceResult<unknown>> {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { tenantId },
    });

    if (!profile) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Provider profile not found');
    }

    const job = await this.prisma.jobPosting.findFirst({
      where: { id: jobId, providerProfileId: profile.id },
    });

    if (!job) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Job posting not found');
    }

    const updated = await this.prisma.jobPosting.update({
      where: { id: jobId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.salaryMin !== undefined && { salaryMin: dto.salaryMin }),
        ...(dto.salaryMax !== undefined && { salaryMax: dto.salaryMax }),
        ...(dto.salaryCurrency !== undefined && { salaryCurrency: dto.salaryCurrency }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.country !== undefined && { country: dto.country }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.expiresAt !== undefined && { expiresAt: new Date(dto.expiresAt) }),
      },
    });

    return ServiceResult.ok(updated);
  }

  async deleteJobPosting(
    tenantId: string,
    jobId: string,
  ): Promise<ServiceResult<unknown>> {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { tenantId },
    });

    if (!profile) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Provider profile not found');
    }

    const job = await this.prisma.jobPosting.findFirst({
      where: { id: jobId, providerProfileId: profile.id },
    });

    if (!job) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Job posting not found');
    }

    await this.prisma.jobPosting.update({
      where: { id: jobId },
      data: { isActive: false },
    });

    return ServiceResult.ok({ deleted: true });
  }

  async listJobApplications(
    tenantId: string,
    jobId: string,
    page: number,
    pageSize: number,
  ): Promise<ServiceResult<PaginatedResult<unknown>>> {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { tenantId },
    });

    if (!profile) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Provider profile not found');
    }

    const job = await this.prisma.jobPosting.findFirst({
      where: { id: jobId, providerProfileId: profile.id },
    });

    if (!job) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Job posting not found');
    }

    const where = { jobPostingId: jobId };

    const [items, totalCount] = await Promise.all([
      this.prisma.jobApplication.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.jobApplication.count({ where }),
    ]);

    return ServiceResult.ok(paginate(items, totalCount, { page, pageSize }));
  }

  // === Public Endpoints ===

  async listActiveJobs(filters: {
    country?: string;
    city?: string;
    type?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ServiceResult<PaginatedResult<unknown>>> {
    const page = filters.page ?? 1;
    const pageSize = Math.min(filters.pageSize ?? 20, 100);

    const now = new Date();
    const where: Record<string, unknown> = {
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: now } },
      ],
    };

    const profileWhere: Record<string, unknown> = {};
    if (filters.country) {
      profileWhere.country = { equals: filters.country, mode: 'insensitive' };
    }
    if (filters.city) {
      profileWhere.city = { equals: filters.city, mode: 'insensitive' };
    }

    if (Object.keys(profileWhere).length > 0) {
      where.providerProfile = profileWhere;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.search) {
      where.title = { contains: filters.search, mode: 'insensitive' };
    }

    const [items, totalCount] = await Promise.all([
      this.prisma.jobPosting.findMany({
        where,
        include: {
          providerProfile: {
            select: {
              id: true,
              city: true,
              country: true,
              coverImageUrl: true,
              isVerified: true,
              tenant: { select: { id: true, name: true, slug: true } },
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.jobPosting.count({ where }),
    ]);

    const mapped = items.map((job: any) => ({
      id: job.id,
      title: job.title,
      description: job.description || '',
      type: job.type,
      salaryMin: job.salaryMin ? Number(job.salaryMin) : null,
      salaryMax: job.salaryMax ? Number(job.salaryMax) : null,
      salaryCurrency: job.salaryCurrency,
      city: job.city,
      country: job.country,
      expiresAt: job.expiresAt,
      createdAt: job.createdAt,
      provider: {
        id: job.providerProfile.id,
        name: job.providerProfile.tenant?.name || 'Unnamed',
        slug: job.providerProfile.tenant?.slug || job.providerProfile.id,
        city: job.providerProfile.city || '',
        country: job.providerProfile.country || '',
        coverPhoto: job.providerProfile.coverImageUrl,
        verified: job.providerProfile.isVerified || false,
      },
    }));

    return ServiceResult.ok(paginate(mapped, totalCount, { page, pageSize }));
  }

  async getJobById(jobId: string): Promise<ServiceResult<unknown>> {
    const job = await this.prisma.jobPosting.findFirst({
      where: {
        id: jobId,
        isActive: true,
      },
      include: {
        providerProfile: {
          select: {
            id: true,
            city: true,
            country: true,
            coverImageUrl: true,
            isVerified: true,
            whatsapp: true,
            phone: true,
            email: true,
            tenant: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });

    if (!job) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Job posting not found');
    }

    const j = job as any;
    return ServiceResult.ok({
      id: j.id,
      title: j.title,
      description: j.description || '',
      type: j.type,
      salaryMin: j.salaryMin ? Number(j.salaryMin) : null,
      salaryMax: j.salaryMax ? Number(j.salaryMax) : null,
      salaryCurrency: j.salaryCurrency,
      city: j.city,
      country: j.country,
      expiresAt: j.expiresAt,
      createdAt: j.createdAt,
      provider: {
        id: j.providerProfile.id,
        name: j.providerProfile.tenant?.name || 'Unnamed',
        slug: j.providerProfile.tenant?.slug || j.providerProfile.id,
        city: j.providerProfile.city || '',
        country: j.providerProfile.country || '',
        coverPhoto: j.providerProfile.coverImageUrl,
        verified: j.providerProfile.isVerified || false,
        whatsapp: j.providerProfile.whatsapp || '',
        phone: j.providerProfile.phone || '',
        email: j.providerProfile.email || '',
      },
    });
  }

  async getLatestJobs(): Promise<ServiceResult<unknown>> {
    const now = new Date();

    const jobs = await this.prisma.jobPosting.findMany({
      where: {
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
      include: {
        providerProfile: {
          select: {
            id: true,
            city: true,
            country: true,
            coverImageUrl: true,
            isVerified: true,
            tenant: { select: { id: true, name: true, slug: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const mapped = jobs.map((job: any) => ({
      id: job.id,
      title: job.title,
      description: job.description || '',
      type: job.type,
      salaryMin: job.salaryMin ? Number(job.salaryMin) : null,
      salaryMax: job.salaryMax ? Number(job.salaryMax) : null,
      salaryCurrency: job.salaryCurrency,
      city: job.city,
      country: job.country,
      expiresAt: job.expiresAt,
      createdAt: job.createdAt,
      provider: {
        id: job.providerProfile.id,
        name: job.providerProfile.tenant?.name || 'Unnamed',
        slug: job.providerProfile.tenant?.slug || job.providerProfile.id,
        city: job.providerProfile.city || '',
        country: job.providerProfile.country || '',
        coverPhoto: job.providerProfile.coverImageUrl,
        verified: job.providerProfile.isVerified || false,
      },
    }));

    return ServiceResult.ok(mapped);
  }

  async getProviderJobs(providerProfileId: string): Promise<ServiceResult<PaginatedResult<unknown>>> {
    const now = new Date();
    const where = {
      providerProfileId,
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: now } },
      ],
    };

    const [items, totalCount] = await Promise.all([
      this.prisma.jobPosting.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.jobPosting.count({ where }),
    ]);

    const mapped = items.map((job) => ({
      ...job,
      salaryMin: job.salaryMin ? Number(job.salaryMin) : null,
      salaryMax: job.salaryMax ? Number(job.salaryMax) : null,
    }));

    return ServiceResult.ok(paginate(mapped, totalCount, { page: 1, pageSize: 20 }));
  }

  async applyToJob(
    jobId: string,
    dto: CreateJobApplicationDto,
  ): Promise<ServiceResult<unknown>> {
    const now = new Date();
    const job = await this.prisma.jobPosting.findFirst({
      where: {
        id: jobId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
    });

    if (!job) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Job posting not found or expired');
    }

    const application = await this.prisma.jobApplication.create({
      data: {
        jobPostingId: jobId,
        applicantName: dto.applicantName,
        phone: dto.phone,
        email: dto.email,
        message: dto.message,
        resumeUrl: dto.resumeUrl,
      },
    });

    return ServiceResult.ok(application);
  }

  // === Expiry Job ===

  async expireJobPostings(): Promise<number> {
    const now = new Date();

    const result = await this.prisma.jobPosting.updateMany({
      where: {
        isActive: true,
        expiresAt: { lt: now },
      },
      data: { isActive: false },
    });

    this.logger.log(`Expired ${result.count} job postings`);
    return result.count;
  }
}
