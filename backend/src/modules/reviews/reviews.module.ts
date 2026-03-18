import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { PublicReviewsController } from './public-reviews.controller';
import { AdminReviewsController } from './admin-reviews.controller';

@Module({
  controllers: [ReviewsController, PublicReviewsController, AdminReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
