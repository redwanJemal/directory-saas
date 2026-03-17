import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ServiceResult } from '../../common/types';
import { PaginatedResult, paginate } from '../../common/dto/pagination.dto';
import { ErrorCodes } from '../../common/constants/error-codes';
import { SubmitVerificationDto } from './dto/submit-verification.dto';
import { ReviewVerificationDto } from './dto/review-verification.dto';

@Injectable()
export class VerificationService {
  constructor(private readonly prisma: PrismaService) {}

  async submitVerification(
    tenantId: string,
    dto: SubmitVerificationDto,
  ): Promise<ServiceResult<unknown>> {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { tenantId },
    });

    if (!profile) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Provider profile not found');
    }

    if (profile.isVerified) {
      return ServiceResult.fail(ErrorCodes.CONFLICT, 'Business is already verified');
    }

    // Check for existing pending request
    const existingPending = await this.prisma.verificationRequest.findFirst({
      where: { providerProfileId: profile.id, status: 'pending' },
    });

    if (existingPending) {
      return ServiceResult.fail(
        ErrorCodes.CONFLICT,
        'A verification request is already pending',
      );
    }

    const request = await this.prisma.verificationRequest.create({
      data: {
        providerProfileId: profile.id,
        tradeLicenseUrl: dto.tradeLicenseUrl,
        documentUrls: dto.documentUrls as Prisma.InputJsonValue,
        notes: dto.notes,
      },
    });

    return ServiceResult.ok(request);
  }

  async getVerificationStatus(
    tenantId: string,
  ): Promise<ServiceResult<unknown>> {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { tenantId },
    });

    if (!profile) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Provider profile not found');
    }

    const latestRequest = await this.prisma.verificationRequest.findFirst({
      where: { providerProfileId: profile.id },
      orderBy: { createdAt: 'desc' },
    });

    return ServiceResult.ok({
      isVerified: profile.isVerified,
      verifiedAt: profile.verifiedAt,
      latestRequest: latestRequest
        ? {
            id: latestRequest.id,
            status: latestRequest.status,
            adminNotes: latestRequest.adminNotes,
            reviewedAt: latestRequest.reviewedAt,
            createdAt: latestRequest.createdAt,
          }
        : null,
    });
  }

  async listVerificationRequests(
    page: number,
    pageSize: number,
    filters?: { status?: string },
  ): Promise<ServiceResult<PaginatedResult<unknown>>> {
    const where: Prisma.VerificationRequestWhereInput = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    const [items, totalCount] = await Promise.all([
      this.prisma.verificationRequest.findMany({
        where,
        include: {
          providerProfile: {
            include: {
              tenant: { select: { id: true, name: true, slug: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.verificationRequest.count({ where }),
    ]);

    return ServiceResult.ok(paginate(items, totalCount, { page, pageSize }));
  }

  async reviewVerification(
    requestId: string,
    reviewerId: string,
    dto: ReviewVerificationDto,
  ): Promise<ServiceResult<unknown>> {
    const request = await this.prisma.verificationRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Verification request not found');
    }

    if (request.status !== 'pending') {
      return ServiceResult.fail(
        ErrorCodes.CONFLICT,
        `Request has already been ${request.status}`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedRequest = await tx.verificationRequest.update({
        where: { id: requestId },
        data: {
          status: dto.status,
          adminNotes: dto.adminNotes,
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
        },
      });

      if (dto.status === 'approved') {
        await tx.providerProfile.update({
          where: { id: request.providerProfileId },
          data: {
            isVerified: true,
            verifiedAt: new Date(),
          },
        });
      }

      return updatedRequest;
    });

    return ServiceResult.ok(updated);
  }
}
