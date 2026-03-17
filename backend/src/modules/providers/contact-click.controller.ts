import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ContactClickService } from './contact-click.service';
import { ProvidersService } from './providers.service';
import { Public } from '../../common/decorators/public.decorator';
import { Throttle } from '../../common/decorators/throttle.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { RecordContactClickSchema, RecordContactClickDto } from './dto';

/**
 * Public endpoint for recording contact clicks.
 * Rate-limited to 10 clicks per minute per IP.
 */
@Controller('providers')
export class ContactClickController {
  constructor(
    private readonly contactClickService: ContactClickService,
    private readonly providersService: ProvidersService,
  ) {}

  @Post(':id/contact-click')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ limit: 10, ttl: 60 })
  async recordContactClick(
    @Param('id') providerProfileId: string,
    @Body(new ZodValidationPipe(RecordContactClickSchema))
    dto: RecordContactClickDto,
    @Req() req: Request,
  ) {
    const result = await this.contactClickService.recordClick(
      providerProfileId,
      dto.type,
      {
        ipAddress: this.getClientIp(req),
        userAgent: req.headers['user-agent'] || undefined,
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
 * Provider dashboard: contact click analytics.
 */
@Controller('providers')
@UseGuards(JwtAuthGuard)
export class ProviderContactStatsController {
  constructor(
    private readonly contactClickService: ContactClickService,
    private readonly providersService: ProvidersService,
  ) {}

  @Get('me/contact-stats')
  async getContactStats(
    @CurrentTenant() tenantId: string,
    @Query('days') days?: string,
  ) {
    const profileResult = await this.providersService.getProfile(tenantId);
    if (!profileResult.success) throw profileResult.toHttpException();
    const profile = profileResult.data as { id: string };

    const result = await this.contactClickService.getClickStats(
      profile.id,
      days ? parseInt(days, 10) : 30,
    );
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Get('me/contact-stats/daily')
  async getDailyContactStats(
    @CurrentTenant() tenantId: string,
    @Query('days') days?: string,
  ) {
    const profileResult = await this.providersService.getProfile(tenantId);
    if (!profileResult.success) throw profileResult.toHttpException();
    const profile = profileResult.data as { id: string };

    const result = await this.contactClickService.getDailyClickStats(
      profile.id,
      days ? parseInt(days, 10) : 30,
    );
    if (!result.success) throw result.toHttpException();
    return result.data;
  }
}

/**
 * Admin: aggregate contact analytics.
 */
@Controller('admin/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class AdminContactAnalyticsController {
  constructor(
    private readonly contactClickService: ContactClickService,
  ) {}

  @Get('contacts')
  async getContactAnalytics(@Query('days') days?: string) {
    const result = await this.contactClickService.getAdminContactAnalytics(
      days ? parseInt(days, 10) : 30,
    );
    if (!result.success) throw result.toHttpException();
    return result.data;
  }
}
