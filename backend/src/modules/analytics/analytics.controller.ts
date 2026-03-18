import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Throttle } from '../../common/decorators/throttle.decorator';
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

/**
 * Public endpoint for recording profile views.
 * Rate-limited to prevent abuse.
 */
@ApiTags('Analytics')
@Controller('providers')
export class ProfileViewController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post(':id/view')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ limit: 30, ttl: 60 })
  async recordProfileView(
    @Param('id') providerProfileId: string,
    @Req() req: Request,
  ) {
    const result = await this.analyticsService.recordProfileView(
      providerProfileId,
      {
        ipAddress: this.getClientIp(req),
        userAgent: req.headers['user-agent'] || undefined,
        referrer: req.headers['referer'] || undefined,
      },
    );
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  private getClientIp(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = typeof forwarded === 'string' ? forwarded : forwarded[0];
      return ips.split(',')[0].trim();
    }
    return request.ip || request.socket?.remoteAddress || '127.0.0.1';
  }
}

/**
 * Admin platform metrics endpoint.
 */
@ApiTags('Admin Analytics')
@Controller('admin/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class AdminAnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('platform')
  async getPlatformMetrics(@Query('days') days?: string) {
    const result = await this.analyticsService.getAdminPlatformMetrics(
      days ? parseInt(days, 10) : 30,
    );
    if (!result.success) throw result.toHttpException();
    return result.data;
  }
}
