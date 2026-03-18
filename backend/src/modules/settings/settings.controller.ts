import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/jwt.strategy';

@ApiTags('Settings')
@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('business-hours')
  async getBusinessHours(@CurrentUser() user: JwtPayload) {
    const tenantId = user.tenantId ?? user.sub;
    const result = await this.settingsService.getBusinessHours(tenantId);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Patch('business-hours')
  async updateBusinessHours(
    @CurrentUser() user: JwtPayload,
    @Body() body: Record<string, unknown>,
  ) {
    const tenantId = user.tenantId ?? user.sub;
    const result = await this.settingsService.updateBusinessHours(tenantId, body);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Get('notifications')
  async getNotificationPrefs(@CurrentUser() user: JwtPayload) {
    const result = await this.settingsService.getNotificationPrefs(
      user.sub,
      user.userType,
    );
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Patch('notifications')
  async updateNotificationPrefs(
    @CurrentUser() user: JwtPayload,
    @Body() body: Record<string, unknown>,
  ) {
    const result = await this.settingsService.updateNotificationPrefs(
      user.sub,
      user.userType,
      body,
    );
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

}
