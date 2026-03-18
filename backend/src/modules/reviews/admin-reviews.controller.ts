import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { z } from 'zod';

const ModerateReviewSchema = z.object({
  isPublic: z.boolean(),
});

type ModerateReviewDto = z.infer<typeof ModerateReviewSchema>;

@ApiTags('Admin Reviews')
@Controller('admin/reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class AdminReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  async list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('rating') rating?: string,
    @Query('isPublic') isPublic?: string,
    @Query('search') search?: string,
  ) {
    const parsedPage = Math.max(1, parseInt(page || '1', 10) || 1);
    const parsedPageSize = Math.min(
      100,
      Math.max(1, parseInt(pageSize || '20', 10) || 20),
    );

    const filters: {
      rating?: number;
      isPublic?: boolean;
      search?: string;
    } = {};
    if (rating) filters.rating = parseInt(rating, 10);
    if (isPublic === 'true') filters.isPublic = true;
    if (isPublic === 'false') filters.isPublic = false;
    if (search) filters.search = search;

    const result = await this.reviewsService.listAllReviews(
      parsedPage,
      parsedPageSize,
      filters,
    );
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Patch(':id/moderate')
  async moderate(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ModerateReviewSchema)) dto: ModerateReviewDto,
  ) {
    const result = await this.reviewsService.moderateReview(id, dto.isPublic);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }
}
