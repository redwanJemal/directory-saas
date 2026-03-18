import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CreateReviewSchema, CreateReviewDto } from './dto';

@Controller('providers')
export class PublicReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get(':providerId/reviews')
  @Public()
  async listPublicReviews(
    @Param('providerId') providerId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize || '20', 10) || 20));

    const result = await this.reviewsService.listPublicReviews(providerId, pageNum, pageSizeNum);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Get(':providerId/reviews/summary')
  @Public()
  async getReviewSummary(@Param('providerId') providerId: string) {
    const result = await this.reviewsService.getPublicReviewSummary(providerId);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Post(':providerId/reviews')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async submitReview(
    @Param('providerId') providerId: string,
    @CurrentUser('id') clientId: string,
    @Body(new ZodValidationPipe(CreateReviewSchema)) dto: CreateReviewDto,
  ) {
    const result = await this.reviewsService.submitReview(clientId, {
      ...dto,
      providerId,
    });
    if (!result.success) throw result.toHttpException();
    return result.data;
  }
}
