import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { RespondToReviewSchema, RespondToReviewDto } from './dto';

@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  async list(
    @CurrentTenant() tenantId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('rating') rating?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize || '20', 10) || 20));
    const filters = rating ? { rating: parseInt(rating, 10) } : undefined;

    const result = await this.reviewsService.listReviews(
      tenantId,
      pageNum,
      pageSizeNum,
      filters,
    );
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Get('summary')
  async summary(@CurrentTenant() tenantId: string) {
    const result = await this.reviewsService.getReviewSummary(tenantId);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Post(':reviewId/response')
  async respond(
    @CurrentTenant() tenantId: string,
    @Param('reviewId') reviewId: string,
    @Body(new ZodValidationPipe(RespondToReviewSchema)) dto: RespondToReviewDto,
  ) {
    const result = await this.reviewsService.respondToReview(tenantId, reviewId, dto);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }
}
