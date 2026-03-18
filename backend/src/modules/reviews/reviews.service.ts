import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ServiceResult } from '../../common/types';
import { PaginatedResult, paginate } from '../../common/dto/pagination.dto';
import { ErrorCodes } from '../../common/constants/error-codes';
import { RespondToReviewDto, CreateReviewDto } from './dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async listReviews(
    tenantId: string,
    page: number,
    pageSize: number,
    filters?: { rating?: number },
  ): Promise<ServiceResult<unknown>> {
    const where: Record<string, unknown> = { tenantId };
    if (filters?.rating) {
      where.rating = filters.rating;
    }

    const [items, totalCount] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          client: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.review.count({ where }),
    ]);

    return ServiceResult.ok(paginate(items, totalCount, { page, pageSize }));
  }

  async getReviewSummary(tenantId: string): Promise<ServiceResult<unknown>> {
    const [aggregate, distribution] = await Promise.all([
      this.prisma.review.aggregate({
        where: { tenantId },
        _avg: { rating: true },
        _count: { id: true },
      }),
      this.prisma.review.groupBy({
        by: ['rating'],
        where: { tenantId },
        _count: { id: true },
      }),
    ]);

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const entry of distribution) {
      ratingDistribution[entry.rating] = entry._count.id;
    }

    return ServiceResult.ok({
      average: aggregate._avg.rating ?? 0,
      total: aggregate._count.id,
      distribution: ratingDistribution,
    });
  }

  async submitReview(
    clientId: string,
    dto: CreateReviewDto,
  ): Promise<ServiceResult<unknown>> {
    // Find provider profile to get the tenantId
    const profile = await this.prisma.providerProfile.findUnique({
      where: { id: dto.providerId },
      select: { id: true, tenantId: true },
    });

    if (!profile) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Provider not found');
    }

    // Check if client already reviewed this business
    const existing = await this.prisma.review.findUnique({
      where: {
        tenantId_clientId: {
          tenantId: profile.tenantId,
          clientId,
        },
      },
    });

    if (existing) {
      return ServiceResult.fail(ErrorCodes.ALREADY_EXISTS, 'You have already reviewed this business');
    }

    const review = await this.prisma.review.create({
      data: {
        tenantId: profile.tenantId,
        clientId,
        rating: dto.rating,
        title: dto.title || null,
        comment: dto.comment || null,
      },
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Update provider reviewCount and rating
    const aggregate = await this.prisma.review.aggregate({
      where: { tenantId: profile.tenantId },
      _avg: { rating: true },
      _count: { id: true },
    });

    await this.prisma.providerProfile.update({
      where: { id: profile.id },
      data: {
        rating: aggregate._avg.rating ?? 0,
        reviewCount: aggregate._count.id,
      },
    });

    return ServiceResult.ok(review);
  }

  async listPublicReviews(
    providerId: string,
    page: number,
    pageSize: number,
  ): Promise<ServiceResult<unknown>> {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { id: providerId },
      select: { tenantId: true },
    });

    if (!profile) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Provider not found');
    }

    const where = { tenantId: profile.tenantId, isPublic: true };

    const [items, totalCount] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          client: { select: { id: true, firstName: true, lastName: true } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.review.count({ where }),
    ]);

    return ServiceResult.ok(paginate(items, totalCount, { page, pageSize }));
  }

  async getPublicReviewSummary(providerId: string): Promise<ServiceResult<unknown>> {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { id: providerId },
      select: { tenantId: true },
    });

    if (!profile) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Provider not found');
    }

    return this.getReviewSummary(profile.tenantId);
  }

  async listAllReviews(
    page: number,
    pageSize: number,
    filters?: { rating?: number; isPublic?: boolean; search?: string },
  ): Promise<ServiceResult<PaginatedResult<unknown>>> {
    const where: Prisma.ReviewWhereInput = {};

    if (filters?.rating) {
      where.rating = filters.rating;
    }
    if (filters?.isPublic !== undefined) {
      where.isPublic = filters.isPublic;
    }
    if (filters?.search) {
      where.OR = [
        { comment: { contains: filters.search, mode: 'insensitive' } },
        { title: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [items, totalCount] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          client: {
            select: { id: true, firstName: true, lastName: true },
          },
          tenant: {
            select: { id: true, name: true, slug: true },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.review.count({ where }),
    ]);

    return ServiceResult.ok(paginate(items, totalCount, { page, pageSize }));
  }

  async moderateReview(
    reviewId: string,
    isPublic: boolean,
  ): Promise<ServiceResult<unknown>> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Review not found');
    }

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: { isPublic },
      include: {
        client: {
          select: { id: true, firstName: true, lastName: true },
        },
        tenant: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return ServiceResult.ok(updated);
  }

  async respondToReview(
    tenantId: string,
    reviewId: string,
    dto: RespondToReviewDto,
  ): Promise<ServiceResult<unknown>> {
    const review = await this.prisma.review.findFirst({
      where: { id: reviewId, tenantId },
    });

    if (!review) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Review not found');
    }

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        response: dto.response,
      },
    });

    return ServiceResult.ok(updated);
  }
}
