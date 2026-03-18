import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AnalyticsService } from './analytics.service';
import {
  AnalyticsController,
  ProfileViewController,
  AdminAnalyticsController,
} from './analytics.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    AnalyticsController,
    ProfileViewController,
    AdminAnalyticsController,
  ],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
