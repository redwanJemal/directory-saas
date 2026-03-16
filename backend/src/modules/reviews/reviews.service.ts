import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ServiceResult } from '../../common/types';
import { PaginatedResult, paginate } from '../../common/dto/pagination.dto';
import { ErrorCodes } from '../../common/constants/error-codes';
import { RespondToReviewDto } from './dto';

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
      averageRating: aggregate._avg.rating ?? 0,
      totalCount: aggregate._count.id,
      ratingDistribution,
    });
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
