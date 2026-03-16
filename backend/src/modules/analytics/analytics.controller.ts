import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/jwt.strategy';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('provider')
  async getProviderAnalytics(
    @CurrentUser() user: JwtPayload,
    @Query('period') period?: string,
  ) {
    const tenantId = user.tenantId ?? user.sub;
    const result = await this.analyticsService.getProviderAnalytics(
      tenantId,
      period || '30d',
    );
    if (!result.success) throw result.toHttpException();
    return result.data;
  }
}
